// pages/api/auth/verify-password-send-otp.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { sendOTPEmail } from '@/lib/email';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const { currentPassword, type } = req.body;
  const { userId } = req.user!;

  if (!type || !['email-update', 'password-update'].includes(type)) {
    res.status(400).json({ message: 'Invalid or missing update type' });
    return;
  }

  const db = await connectToDatabase();
  const users = db.collection('users');
  const user = await users.findOne({ _id: new ObjectId(userId) });

  if (!user || !user.passwordHash) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ message: 'Incorrect password' });
    return;
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  await db.collection('otp_verifications').insertOne({
    userId,
    otp,
    type, // 👈 store type like 'email-update' or 'password-update'
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  await sendOTPEmail(user.email, otp);

  res.status(200).json({ 
    message: 'OTP sent to email',
    email: user.email // Include email in response for forgot password functionality
  });
}

export default authenticate(handler);
