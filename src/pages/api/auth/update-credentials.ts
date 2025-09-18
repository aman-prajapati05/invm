// pages/api/auth/update-credentials.ts
import type { NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';

import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { sendPasswordChangedEmail, sendEmailUpdatedNotification } from '@/lib/email';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export default authenticate(async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'PUT') {
    res.status(405).end();
    return;
  }

  const { email, password } = req.body as { email?: string; password?: string };

  const db = await connectToDatabase();
  const users = db.collection('users');
  const refreshTokens = db.collection('refresh_tokens');

  // current user
  let userId: ObjectId;
  try {
    userId = new ObjectId(req.user!.userId);
  } catch {
    res.status(400).json({ message: 'Invalid user ID format' });
    return;
  }

  const existingUser = await users.findOne({ _id: userId });
  if (!existingUser) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  // build updates
  const set: any = { updatedAt: new Date() };
  let passwordChanged = false;
  let emailChanged = false;

  if (email && email !== existingUser.email) {
    const conflict = await users.findOne({ email, _id: { $ne: userId } });
    if (conflict) {
      res.status(409).json({ message: 'Email already exists' });
      return;
    }
    set.email = email;
    emailChanged = true;
  }

  if (password) {
    const passwordHash = await bcrypt.hash(password, 10);
    set.passwordHash = passwordHash;
    // 🔑 bump tokenVersion = kill all existing access tokens
    set.tokenVersion = (existingUser.tokenVersion ?? 0) + 1;
    passwordChanged = true;
  }

  const result = await users.updateOne({ _id: userId }, { $set: set });
  if (result.matchedCount === 0) {
    res.status(404).json({ message: 'User not found during update' });
    return;
  }
  if (result.modifiedCount === 0) {
    res.status(400).json({ message: 'No changes were made' });
    return;
  }

  const updatedUser = await users.findOne({ _id: userId });

  // emails (best-effort)
  try {
    if (passwordChanged) {
      await sendPasswordChangedEmail(updatedUser!.email, updatedUser!.name);
    }
    if (emailChanged) {
  const when = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      await sendEmailUpdatedNotification(
        updatedUser!.email,   // to new email
        updatedUser!.name,
        existingUser.email,   // old
        updatedUser!.email,   // new
        when
      );
    }
  } catch (e) {
    console.error('Notification email error:', e);
  }
  if (passwordChanged) {
  const currentRT = req.cookies?.refreshToken;

  // If no refresh cookie on this device → we can't preserve it; nuke sessions and ask to relogin
  if (!currentRT) {
    await db.collection('refresh_tokens').deleteMany({ userId });
    res.status(200).json({
      message: 'Password changed. All sessions cleared. Please log in again.',
      code: 'RELOGIN_REQUIRED',
    });
    return;
  }

  // 🔐 Logout all OTHER devices: delete all RTs except THIS cookie's token
  await db.collection('refresh_tokens').deleteMany({
    userId,
    token: { $ne: currentRT },
  });

  // ❌ Do NOT rotate the current device's RT here (avoid race)
  // (Optionally, you can re-set the same cookie to refresh maxAge)
  // res.setHeader('Set-Cookie', serialize('refreshToken', currentRT, { ...same options..., maxAge: 7*24*60*60 }));

  // ✅ Mint a fresh ACCESS token with the NEW tokenVersion so this device keeps working
  const tv = typeof updatedUser?.tokenVersion === 'number' ? updatedUser!.tokenVersion : 0;
  const newAccessToken = jwt.sign(
    {
      userId: String(userId),
      permissions: updatedUser?.permissions ?? existingUser.permissions,
      tv,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.status(200).json({
    message: 'Password changed. Other devices were logged out.',
    accessToken: newAccessToken,
  });
  return;
}

  // only email changed → keep sessions
  res.status(200).json({
    message: 'Credentials updated successfully',
    modifiedCount: result.modifiedCount,
  });
  return;
});
