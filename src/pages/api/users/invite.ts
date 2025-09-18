// /pages/api/users/invite.ts

import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt, { SignOptions } from 'jsonwebtoken';
import { sendSetPasswordEmail } from '@/lib/email';
import type { NextApiRequest, NextApiResponse } from 'next';

function generateToken(payload: object, expiresIn: string = '1h'): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(payload, secret, { expiresIn } as any);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const db = await connectToDatabase();
  const { name, email, permissions } = req.body;

  if (!name || !email || !permissions) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const users = db.collection('users');
  const existing = await users.findOne({ email });
  if (existing) return res.status(409).json({ message: 'User already exists' });

  const user = {
    name,
    email,
    permissions,
    status: 'invited',
    createdAt: new Date(),
  };

  const result = await users.insertOne(user);
  const userId = result.insertedId.toString();


  const token = generateToken({ userId }, '1h'); // expires in 1 hour
  console.log(`Generated token for user ${userId}: ${token}`);

  // Save token in DB
  await db.collection('passwordTokens').insertOne({
    token,
    userId: new ObjectId(userId),
    purpose: 'invite',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    used: false,
  });

  await sendSetPasswordEmail(email, token);
  return res.status(201).json({ message: 'Invitation sent' });
}
