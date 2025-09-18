// pages/api/auth/refresh-token.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ code: 'NO_REFRESH', message: 'Refresh token is required' });
  }

  const db = await connectToDatabase();

  // Ensure the RT exists in DB (matches your current storage pattern)
  const record = await db.collection('refresh_tokens').findOne({ token: refreshToken });
  if (!record) {
    return res.status(401).json({ code: 'INVALID_REFRESH', message: 'Invalid refresh token' });
  }

  try {
    // Your refresh JWT currently carries { userId, permissions }
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
      userId: string;
      permissions: any;
      iat: number;
      exp: number;
    };

    // Load user to enforce status and pull current tokenVersion
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });
    if (!user) {
      return res.status(403).json({ code: 'ACCOUNT_DELETED', message: 'Account deleted' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ code: 'ACCOUNT_DEACTIVATED', message: 'Account deactivated' });
    }

    const tokenVersion: number = typeof user.tokenVersion === 'number' ? user.tokenVersion : 0;

    // 👉 IMPORTANT: include tv in the new access token (permissions preserved)
    const newAccessToken = jwt.sign(
      { userId: String(user._id), permissions: payload.permissions ?? user.permissions, tv: tokenVersion },
      JWT_SECRET,
      { expiresIn: '1h' } // keep your current AT lifetime for now
    );

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ code: 'INVALID_REFRESH', message: 'Invalid or expired refresh token' });
  }
}
