import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { sendLoginNotificationEmail } from '@/lib/email';
import { getLocationFromIP } from '@/lib/getlocation';
import { ObjectId } from 'mongodb';


const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, otp } = req.body;
  const db = await connectToDatabase();

  // Find OTP record
  const record = await db.collection('otp_verifications').findOne({ email, otp });
  if (!record || new Date(record.expiresAt) < new Date()) {
    return res.status(401).json({ message: 'Invalid or expired OTP' });
  }

  // Find user
  const user = await db.collection('users').findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.status && user.status == 'deactive') {
    return res.status(403).json({ message: 'Your account is not active yet. Contact Admin' });
  }

   const tokenVersion = typeof user.tokenVersion === 'number' ? user.tokenVersion : 0;
  if (user.tokenVersion !== tokenVersion) {
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { tokenVersion } }
    );
  }

  // ✅ maintenance check
  type AppConfigDoc = { _id: string; maintenance?: { enabled?: boolean } };
  const appConfig = await db
  .collection<AppConfigDoc>('app_config')
  .findOne({ _id: 'global' });
  const maintenanceEnabled = appConfig?.maintenance?.enabled ?? false;

  // Clean up old refresh tokens for this user (keep only the most recent 3)
  const existingTokens = await db.collection('refresh_tokens')
    .find({ userId: user._id })
    .sort({ createdAt: -1 })
    .toArray();

  // If user has 3 or more tokens, remove the oldest ones
  if (existingTokens.length >= 3) {
    const tokensToKeep = existingTokens.slice(0, 2); // Keep 2 most recent
    const tokenIdsToKeep = tokensToKeep.map(t => t._id);

    await db.collection('refresh_tokens').deleteMany({
      userId: user._id,
      _id: { $nin: tokenIdsToKeep }
    });
  }

  // Also clean up expired tokens for all users (optional - good housekeeping)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await db.collection('refresh_tokens').deleteMany({
    createdAt: { $lt: sevenDaysAgo }
  });

  // Generate tokens
  const accessToken = jwt.sign(
    { userId: user._id, permissions: user.permissions, tv: tokenVersion },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id, permissions: user.permissions },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  // Save new refresh token in DB
  await db.collection('refresh_tokens').insertOne({
    userId: user._id,
    token: refreshToken,
    createdAt: new Date(),
  });

  // Set HttpOnly cookie for refresh token
  res.setHeader('Set-Cookie', serialize('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  }));

  // Update user's last login
  const lastLoginTime = new Date();
  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { lastLogin: lastLoginTime } }
  );

  // Clean up OTP
  await db.collection('otp_verifications').deleteMany({ email });

  // ✅ Send login notification email (async, don't wait for it)
  const ipAddress = (req.headers['x-forwarded-for'] as string) ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'Unknown';

  const userAgent = req.headers['user-agent'] as string;

  // Get location and send notification without blocking the response
  getLocationFromIP(ipAddress)
    .then(async (location: any) => {
      await sendLoginNotificationEmail(email, ipAddress, userAgent, location);
      console.log(`Login notification sent to ${email}`);
    })
    .catch((error: Error) => {
      console.error(`Failed to send login notification to ${email}:`, error);
    });

  // Send response with access token and user
  return res.status(200).json({
    accessToken,
    maintenance: maintenanceEnabled,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      status: user.status,
      permissions: user.permissions,
      lastLogin: lastLoginTime,
    },
  });
}