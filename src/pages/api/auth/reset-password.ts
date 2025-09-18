// pages/api/auth/reset-password.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, otp, newPassword } = req.body;
  const db = await connectToDatabase();

  const record = await db.collection('otp_verifications').findOne({
    email,
    otp,
    purpose: 'forgot-password',
  });

  if (!record || new Date(record.expiresAt) < new Date()) {
    return res.status(401).json({ message: 'Invalid or expired OTP' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.collection('users').updateOne(
    { email },
    { $set: { passwordHash } }
  );

  // Cleanup OTP
  await db.collection('otp_verifications').deleteMany({ email, purpose: 'forgot-password' });

  return res.status(200).json({ message: 'Password updated successfully' });
}
