// pages/api/auth/resend-otp.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { sendOTPEmail } from '@/lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const db = await connectToDatabase();
  const user = await db.collection('users').findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Generate new OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  await db.collection('otp_verifications').insertOne({
    email,
    otp,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 min expiry
  });

  await sendOTPEmail(email, otp);

  return res.status(200).json({ message: 'OTP resent to your email' });
}
