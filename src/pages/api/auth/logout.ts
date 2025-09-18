// pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'Missing token' });

  const db = await connectToDatabase();
  await db.collection('refresh_tokens').deleteOne({ token: refreshToken });

  return res.status(200).json({ message: 'Logged out successfully' });
}
