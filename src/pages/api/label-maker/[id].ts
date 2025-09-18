import type { NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { AuthenticatedRequest, requirePermission } from '@/lib/middleware/authMiddleware';
import warehouse from '../warehouse';


// Enhanced types for better type safety
type OrderItem = {
  itemCode: string;
  quantity: number | string;
  [key: string]: any;
}

type ProcessedItem = {
  itemCode: string;
  quantity: number | string;
  cartons: number | null;
  internalSku: string | null;
  dimensions: {
    length: number | null;
    breadth: number | null;
    height: number | null;
  } | null;
}

type OrderDetailResponse = {
  source: string;
  poNumber: string;
  labelStatus?: string;
  invoiceNumber?: string;
  manifestStatus?: string;
  awbNumber?: string;
  courier?: string;
  dispatchDate?: string | Date; // Add dispatch date to the type
  deliveredTo: string;
  items: ProcessedItem[];
}

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const { id } = req.query;

  // 🔧 FIX 1: Enhanced method validation
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ 
      message: `Method ${req.method} not allowed`,
      allowedMethods: ['GET']
    });
  }

  // 🔧 FIX 2: Enhanced input validation
  if (!id) {
    return res.status(400).json({ 
      message: 'Order ID is required',
      field: 'id'
    });
  }

  if (typeof id !== 'string') {
    return res.status(400).json({ 
      message: 'Order ID must be a string',
      received: typeof id
    });
  }

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ 
      message: 'Invalid ObjectId format',
      provided: id
    });
  }

  // 🔧 FIX 3: Database connection with error handling
  let db;
  try {
    db = await connectToDatabase();
  } catch (dbError) {
    console.error('Database connection error:', {
      error: typeof dbError === 'object' && dbError !== null && 'message' in dbError ? (dbError as { message?: string }).message : String(dbError),
      orderId: id,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ 
      message: 'Database connection failed' 
    });
  }

  try {
    const result = await db.collection('orders').aggregate([
  { $match: { _id: new ObjectId(id) } },
  {
    $project: {
      _id: 0,
      source: { $ifNull: ['$source', 'Unknown'] },
      poNumber: { $ifNull: ['$po_number', 'N/A'] },
      labelStatus: 1,
      invoiceNumber: 1,
      manifestStatus: 1,
      awbNumber: 1,
      courier: 1,
      dispatchDate: 1, // Add dispatch date to the projection
      warehouseCode: {
        $ifNull: ['$data.poDetails.warehouseCode', '$poDetails.warehouseCode']
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


    // 🔧 FIX 12: Enhanced result validation
    if (!result || result.length === 0) {
      return res.status(404).json({ 
        message: 'Order not found',
        orderId: id
      });
    }

    const orderData = result[0] as OrderDetailResponse;

    // 🔧 FIX 13: Validate essential fields
    if (!orderData.source) {
      console.warn(`Order ${id} missing source field`);
    }

    if (!orderData.items || orderData.items.length === 0) {
      console.warn(`Order ${id} has no items`);
    }

    return res.status(200).json(orderData);

  } catch (error: any) {
    // 🔧 FIX 14: Enhanced error logging and handling
    console.error('Order detail aggregation error:', {
      orderId: id,
      error: error?.message || String(error),
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      errorType: error?.name,
      ...(error?.name === 'MongoServerError' && {
        mongoError: {
          code: error?.code,
          codeName: error?.codeName
        }
      })
    });

    // Return appropriate error response based on error type
    if (error?.name === 'MongoServerError') {
      return res.status(500).json({
        message: 'Database query failed',
        details: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
      });
    }

    if (error?.message?.includes('ObjectId')) {
      return res.status(400).json({
        message: 'Invalid order ID format',
        details: process.env.NODE_ENV === 'development' ? error?.message : 'Invalid ID'
      });
    }

    return res.status(500).json({
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        details: error?.message || String(error)
      })
    });
  }
};

// Export with permission middleware
export default requirePermission('label')(handler);