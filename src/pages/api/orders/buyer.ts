// pages/api/orders/buyer.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { requireAnyPermission, requirePermission } from '@/lib/middleware/authMiddleware';


const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    const buyers = await db.collection('orders').distinct('source');

    return res.status(200).json({ buyers });
  } catch (error) {
    console.error('Error fetching buyers:', error);
    return res.status(500).json({ message: 'Failed to fetch buyers', error });
  }
};

export default requireAnyPermission(['orders','sku','buyer'])(handler);
