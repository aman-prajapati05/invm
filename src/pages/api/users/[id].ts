import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { authenticate, AuthenticatedRequest, requirePermission } from '@/lib/middleware/authMiddleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const {
    query: { id },
    method,
    user,
  } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${method} not allowed` });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid or missing user ID' });
  }

  const db = await connectToDatabase();
  const collection = db.collection('users');

  try {
    const userDoc = await collection.findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          passwordHash: 0, // Never expose password hash
        },
      }
    );

    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(userDoc);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ Only users with "user" permission or admin can access
export default requirePermission('user')(handler);
