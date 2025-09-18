// /pages/api/users/resend-invite.ts

import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
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
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const users = db.collection('users');
    const user = await users.findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has already logged in
    if (user.lastLogin) {
      return res.status(400).json({ message: 'User has already activated their account' });
    }
    

    // Generate new token
    const token = generateToken({ userId }, '1h'); // expires in 1 hour

    // Remove any existing tokens for this user
    await db.collection('passwordTokens').deleteMany({
      userId: new ObjectId(userId)
    });

    // Update user status back to 'invited'
    await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { status: 'invited' } }
    );

    // Save new token in DB
    await db.collection('passwordTokens').insertOne({
      token,
      userId: new ObjectId(userId),
      purpose: 'invite',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      used: false,
    });



    // Send the set password email
    await sendSetPasswordEmail(user.email, token);
    
    return res.status(200).json({ message: 'Invitation resent successfully' });
  } catch (error) {
    console.error('Error resending invite:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
