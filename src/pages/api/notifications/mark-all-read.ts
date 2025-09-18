import type { NextApiResponse } from 'next';
import type { AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { connectToDatabase } from '@/lib/mongodb';
import { authenticate } from '@/lib/middleware/authMiddleware';
import { ObjectId } from 'mongodb';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const db = await connectToDatabase();
  const collection = db.collection('notifications');
  const userId = req.user?.userId;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const result = await collection.updateMany(
      { 
        userId: new ObjectId(userId),
        read: { $ne: true }
      },
      { 
        $set: { 
          read: true,
          readAt: new Date()
        }
      }
    );

    return res.status(200).json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default authenticate(handler);
