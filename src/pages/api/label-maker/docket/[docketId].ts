import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requirePermission } from '@/lib/middleware/authMiddleware';
import warehouse from '../../warehouse';

interface AuthenticatedRequest extends NextApiRequest {
  user?: any;
}

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const { docketId } = req.query;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ 
      message: `Method ${req.method} not allowed`,
      allowedMethods: ['GET']
    });
  }

  if (!docketId || typeof docketId !== 'string') {
    return res.status(400).json({ 
      message: 'Docket ID is required and must be a string',
      provided: docketId
    });
  }

  let db;
  try {
    db = await connectToDatabase();
  } catch (dbError) {
    console.error('Database connection error:', {
      error: dbError instanceof Error ? dbError.message : 'Unknown database error',
      docketId,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ 
      message: 'Database connection failed' 
    });
  }

  try {
    // First, find all orders with this docketId
    const orders = await db.collection('orders').find({ docketId }).toArray();

    if (!orders || orders.length === 0) {
      return res.status(404).json({ 
        message: 'No orders found for this docket',
        docketId
      });
    }

    // Process each order using the same aggregation logic as single order
    const orderDetails = await Promise.all(
      orders.map(async (order) => {
const result = await db.collection('orders').aggregate([
  { $match: { _id: order._id } },
  {
    $project: {
      _id: 1,
      source: { $ifNull: ['$source', 'Unknown'] },
      poNumber: { $ifNull: ['$po_number', 'N/A'] },
      labelStatus: 1,
      invoiceNumber: 1,
      manifestStatus: 1,
      awbNumber: 1,
      courier: 1,
      docketId: 1,
      warehouseCode: {
        $ifNull: ['$poDetails.warehouseCode', '$data.poDetails.warehouseCode', 'Unknown']
      },
      deliveredTo: {
        $ifNull: [
          '$poDetails.deliveredTo',
          '$data.poDetails.deliveredTo',
          'Unknown'
        ]
      },
      items: {
        $map: {
          input: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ['$data.items', []] } }, 0] },
              '$data.items',
              { $ifNull: ['$items', []] }
            ]
          },
          as: 'item',
          in: {
            itemCode: { $ifNull: ['$$item.itemCode', 'Unknown'] },
            quantity: { $ifNull: ['$$item.quantity', 0] },
            cartons: {
              $convert: {
                input: {
                  $replaceAll: {
                    input: { $toString: '$$item.noOfCartons' },
                    find: ',', replacement: ''
                  }
                },
                to: 'double',
                onError: null,
                onNull: null
              }
            },
            internalSku: { $ifNull: ['$$item.internalSku', null] },
            dimensions: {
              $cond: [
                { $ne: ['$$item.dimensions', null] },
                {
                  length: { $ifNull: ['$$item.dimensions.length', null] },
                  breadth: { $ifNull: ['$$item.dimensions.breadth', null] },
                  height: { $ifNull: ['$$item.dimensions.height', null] }
                },
                null
              ]
            }
          }
        }
      }
    }
  }
]).toArray();


        return result[0];
      })
    );

    // Filter out any null results
    const validOrderDetails = orderDetails.filter(order => order !== null);

    if (validOrderDetails.length === 0) {
      return res.status(404).json({ 
        message: 'No valid order details found for this docket',
        docketId
      });
    }

    return res.status(200).json({
      docketId,
      orders: validOrderDetails
    });

  } catch (error) {
    console.error('Docket order aggregation error:', {
      docketId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      errorType: error instanceof Error ? error.name : 'Unknown'
    });

    return res.status(500).json({
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    });
  }
};

export default requirePermission('label')(handler);
