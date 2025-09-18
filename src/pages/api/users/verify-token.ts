// /pages/api/users/verify-token.ts
import { connectToDatabase } from '@/lib/mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const db = await connectToDatabase();
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Token is required' });
  }

  const tokenDoc = await db.collection('passwordTokens').findOne({ token });

  if (!tokenDoc || tokenDoc.used || new Date(tokenDoc.expiresAt) < new Date()) {
    return res.status(400).json({ valid: false });
  }

  return res.status(200).json({ valid: true });
}
