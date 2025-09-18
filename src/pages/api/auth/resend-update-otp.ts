// pages/api/auth/resend-update-otp.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { sendOTPEmail } from '@/lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, type } = req.body;
  if (!email || !type) {
    return res.status(400).json({ message: 'Email and type are required' });
  }

  if (!['email-update', 'password-update'].includes(type)) {
    return res.status(400).json({ message: 'Invalid type. Must be email-update or password-update' });
  }

  const db = await connectToDatabase();
  const user = await db.collection('users').findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Generate new OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Store OTP with type for tracking
  await db.collection('update_otp_verifications').insertOne({
    email,
    otp,
    type,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 min expiry
  });

  await sendOTPEmail(email, otp);

  return res.status(200).json({ message: 'OTP resent to your email' });
}
