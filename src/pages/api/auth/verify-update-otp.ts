// pages/api/auth/verify-update-otp.ts
import type { NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export default authenticate(async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const { otp, type } = req.body;

  if (!type || !['email-update', 'password-update'].includes(type)) {
    res.status(400).json({ message: 'Invalid or missing update type' });
    return;
  }

  const db = await connectToDatabase();
  const otpCollection = db.collection('otp_verifications');

  const record = await otpCollection.findOne({
    userId: req.user!.userId,
    otp: otp.toString(),
    type,
  });

  if (!record) {
    res.status(400).json({ message: 'Invalid OTP' });
    return;
  }

  if (new Date(record.expiresAt) < new Date()) {
    res.status(400).json({ message: 'OTP has expired' });
    return;
  }

  await otpCollection.deleteOne({ _id: record._id });

  res.status(200).json({ message: 'OTP verified successfully' });
});
