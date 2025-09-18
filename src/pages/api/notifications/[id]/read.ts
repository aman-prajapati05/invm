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
  const { id } = req.query;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid notification ID' });
  }

  try {
    const result = await collection.updateOne(
      { 
        _id: new ObjectId(id),
        userId: new ObjectId(userId)
      },
      { 
        $set: { 
          read: true,
          readAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default authenticate(handler);
