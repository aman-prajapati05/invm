import type { NextApiResponse } from 'next';
import type { AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { connectToDatabase } from '@/lib/mongodb';
import { authenticate } from '@/lib/middleware/authMiddleware';
import { ObjectId } from 'mongodb';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const db = await connectToDatabase();
  const collection = db.collection('notifications');

  if (req.method === 'GET') {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const notifications = await collection
      .find({ 
        $or: [
          { userId: new ObjectId(userId) },
          { userId: { $exists: false } } // For backward compatibility with notifications without userId
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({ notifications });
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

export default authenticate(handler);
