import type { NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { AuthenticatedRequest, requirePermission } from '@/lib/middleware/authMiddleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const {
    query: { id },
    method,
  } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${method} not allowed` });
  }

  if (!id || typeof id !== 'string' || !ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid or missing order ID' });
  }

  const db = await connectToDatabase();
  const collection = db.collection('orders');

  try {
    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
      { $unwind: { path: '$data.items', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'buyer_products',
          localField: 'data.items.itemCode',
          foreignField: 'buyerItemCode',
          as: 'buyerProduct',
        },
      },
      { $unwind: { path: '$buyerProduct', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          'buyerProduct.productObjectId': {
            $convert: {
              input: '$buyerProduct.productId',
              to: 'objectId',
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $lookup: {
          from: 'sku_master',
          localField: 'buyerProduct.productObjectId',
          foreignField: '_id',
          as: 'skuMaster',
        },
      },
      { $unwind: { path: '$skuMaster', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          'data.items.itemName': '$skuMaster.itemName',
        },
      },
      {
        $group: {
          _id: '$_id',
          order: { $first: '$$ROOT' },
          items: { $push: '$data.items' },
        },
      },
      {
        $addFields: {
          'order.data.items': '$items',
        },
       
      },
      {
        $replaceRoot: {
          newRoot: '$order',
        },
      },
    ];

    const result = await collection.aggregate(pipeline).toArray();

    if (!result.length) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({
      order: result[0],
      message: 'Order retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default requirePermission('orders')(handler);
