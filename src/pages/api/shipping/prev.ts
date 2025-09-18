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

    // Find the previous order (created before current order)
    const prevOrder = await db.collection('orders').findOne(
      { 
        _id: { $lt: new ObjectId(currentOrderId) },
        awbNumber: { $exists: true, $ne: '' }
      },
      { sort: { _id: -1 } }
    );

    if (!prevOrder) {
      return res.status(404).json({ message: 'No previous shipping manifest order found' });
    }

    return res.status(200).json({ 
      prevOrder: {
        _id: prevOrder._id,
        manifestId: prevOrder.manifestId,
        poNumber: prevOrder.po_number
      }
    });

  } catch (error) {
    console.error('Error fetching previous shipping manifest order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default requirePermission('shipping')(handler);
