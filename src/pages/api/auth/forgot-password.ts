// /pages/api/users/forgot-password.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { sendPasswordResetEmail } from '@/lib/email';
// create similar to sendSetPasswordEmail


function generateToken(payload: object, expiresIn: string = '1h'): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');
  return jwt.sign(payload, secret, { expiresIn } as any);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const db = await connectToDatabase();
  const { email } = req.body as { email?: string };

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const users = db.collection('users');
  const user = await users.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'Email address not found. Please check your email or contact support.' });
  }

  const userId = (user._id as ObjectId).toString();

  // Optional: invalidate existing unused reset tokens for this user (good hygiene)
  await db.collection('passwordTokens').updateMany(
    { userId: new ObjectId(userId), used: false, purpose: 'reset' },
    { $set: { used: true, invalidatedAt: new Date() } }
  );

  const token = generateToken({ userId, purpose: 'reset' }, '1h');

  await db.collection('passwordTokens').insertOne({
    token,
    userId: new ObjectId(userId),
    purpose: 'reset',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    used: false,
    createdAt: new Date(),
  });

  try {
    await sendPasswordResetEmail(email, token);
    return res.status(200).json({ message: 'Password reset link has been sent to your email.' });
  } catch (e) {
    console.error('Failed to send password reset email:', e);
    return res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
  }
}
