import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/middleware/authMiddleware';

 async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { currentOrderId } = req.query;

    if (!currentOrderId || typeof currentOrderId !== 'string') {
        return res.status(400).json({ message: 'Missing or invalid currentOrderId' });
    }

    try {
        const db = await connectToDatabase();

        const currentOrder = await db.collection('orders').findOne({ _id: new ObjectId(currentOrderId) });
        if (!currentOrder || !currentOrder.createdAt) {
            return res.status(404).json({ message: 'Order not found or missing createdAt' });
        }

        const nextOrder = await db.collection('orders')
            .find({ createdAt: { $gt: currentOrder.createdAt } })
            .sort({ createdAt: 1 })
            .limit(1)
            .toArray();

        res.status(200).json({ nextOrder: nextOrder[0] || null });
    } catch (error) {
        console.error('Error fetching next order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export default requireAnyPermission(['orders'])(handler);