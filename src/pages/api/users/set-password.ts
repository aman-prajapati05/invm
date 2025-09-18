// pages/api/users/set-password.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { sendWelcomeEmail } from '@/lib/email';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const db = await connectToDatabase();
  const { token, password } = req.body as { token?: string; password?: string };

  if (!token || !password) { res.status(400).json({ message: 'Missing token or password' }); return; }

  const tokensCol = db.collection('passwordTokens');
  const usersCol = db.collection('users');
  const refreshCol = db.collection('refresh_tokens');

  // 1) Validate the password-reset/invite token
  const tokenDoc = await tokensCol.findOne({ token });
  if (!tokenDoc || tokenDoc.used || new Date(tokenDoc.expiresAt) < new Date()) {
    res.status(400).json({ message: 'Invalid or expired token' });
    return;
  }

  // 2) Hash new password
  const passwordHash = await bcrypt.hash(password, 10);

  // 3) Update user password (+ activate on invite) and bump tokenVersion
  const userId: ObjectId = typeof tokenDoc.userId === 'string' ? new ObjectId(tokenDoc.userId) : tokenDoc.userId;
  const setFields: any = { passwordHash };
  if (tokenDoc.purpose === 'invite') setFields.status = 'active';

  // Bump tokenVersion to invalidate all existing access tokens
  await usersCol.updateOne(
    { _id: userId },
    { $set: setFields, $inc: { tokenVersion: 1 } }
  );

  // 4) Mark token used
  await tokensCol.updateOne(
    { _id: tokenDoc._id },
    { $set: { used: true, usedAt: new Date() } }
  );

  // 5) Load user to get permissions & current tokenVersion
  const user = await usersCol.findOne({ _id: userId });
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }

  // 6) Session handling: keep this device’s RT if present; log out others
  const currentRT = req.cookies?.refreshToken;

  if (currentRT) {
    // Keep only this device’s RT; remove others
    await refreshCol.deleteMany({ userId, token: { $ne: currentRT } });

    // (Do NOT rotate current RT here—avoid race; optionally refresh cookie maxAge)
    res.setHeader('Set-Cookie', serialize('refreshToken', currentRT, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    }));

    // Mint a fresh access token (with new tv) so this device stays authenticated
    const tv: number = typeof user.tokenVersion === 'number' ? user.tokenVersion : 0;
    const accessToken = jwt.sign(
      { userId: String(userId), permissions: user.permissions, tv },
      JWT_SECRET,
      { expiresIn: '1h' } // keep your current AT lifetime
    );

    // 7) Optional welcome email for invite flows (keep your behavior)
    if (tokenDoc.purpose === 'invite') {
      try { await sendWelcomeEmail(user.email, user.name); } catch (e) { /* non-fatal */ }
    }

    res.status(200).json({
      message: 'Password set successfully. Other devices were logged out.',
      accessToken,
    });
    return;
  }

  // No refresh cookie present → we can’t preserve this device; clear all sessions
  await refreshCol.deleteMany({ userId });

  // 7) Optional welcome email for invite flows
  if (tokenDoc.purpose === 'invite') {
    try { await sendWelcomeEmail(user.email, user.name); } catch (e) { /* non-fatal */ }
  }

  res.status(200).json({
    message: 'Password set successfully. Please log in.',
    code: 'RELOGIN_REQUIRED',
  });
  return;
}
