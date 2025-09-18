import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { requirePermission, type AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { ObjectId } from 'mongodb';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { currentOrderId } = req.query;

  if (!currentOrderId || typeof currentOrderId !== 'string' || !ObjectId.isValid(currentOrderId)) {
    return res.status(400).json({ message: 'Valid current order ID is required' });
  }

  try {
    const db = await connectToDatabase();
    
    // Find the current order to get its creation time
    const currentOrder = await db.collection('orders').findOne({ 
      _id: new ObjectId(currentOrderId),
      awbNumber: { $exists: true, $ne: '' }
    });

    if (!currentOrder) {
      return res.status(404).json({ message: 'Current shipping manifest order not found' });
    }

    // Find the next order (created after current order)
    const nextOrder = await db.collection('orders').findOne(
      { 
        _id: { $gt: new ObjectId(currentOrderId) },
        awbNumber: { $exists: true, $ne: '' }
      },
      { sort: { _id: 1 } }
    );

    if (!nextOrder) {
      return res.status(404).json({ message: 'No next shipping manifest order found' });
    }

    return res.status(200).json({ 
      nextOrder: {
        _id: nextOrder._id,
        manifestId: nextOrder.manifestId,
        poNumber: nextOrder.po_number
      }
    });

  } catch (error) {
    console.error('Error fetching next shipping manifest order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default requirePermission('shipping')(handler);
