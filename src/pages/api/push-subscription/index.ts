import type { NextApiResponse } from 'next';
import type { AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { connectToDatabase } from '@/lib/mongodb';
import { authenticate } from '@/lib/middleware/authMiddleware';
import { ObjectId } from 'mongodb';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const db = await connectToDatabase();
  const collection = db.collection('pushSubscriptions');

  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Delete all subscriptions for this user
  const result = await collection.deleteMany({ userId: new ObjectId(userId) });

  return res.status(200).json({ message: 'Deleted push subscriptions', deletedCount: result.deletedCount });
};

export default authenticate(handler);
