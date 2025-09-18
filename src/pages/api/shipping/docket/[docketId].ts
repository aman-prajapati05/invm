import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { requirePermission, type AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { ObjectId } from 'mongodb';

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
    // Find all orders with this docketId that have awbNumber (shipping manifests)
    const orders = await db.collection('orders').find({ 
      docketId,
      awbNumber: { $exists: true, $ne: '' }
    }).toArray();

    console.log(`[DEBUG] Found ${orders.length} orders for docketId: ${docketId}`);

    if (!orders || orders.length === 0) {
      return res.status(404).json({ 
        message: 'No shipping manifest orders found for this docket',
        docketId
      });
    }

    // Simplified processing - only lookup courier from peers if needed
    const orderDetails = await Promise.all(
      orders.map(async (order) => {
        try {
          const result = await db.collection('orders').aggregate([
            { $match: { _id: order._id } },

            // Only lookup courier from peers if this order doesn't have one
            {
              $lookup: {
                from: 'orders',
                let: { 
                  did: '$docketId',
                  hasCourier: { $and: [{ $ne: ['$courier', null] }, { $ne: ['$courier', ''] }] }
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $ne: ['$$did', null] },
                          { $eq: ['$docketId', '$$did'] },
                          { $eq: ['$$hasCourier', false] }, // Only lookup if current order lacks courier
                          { $ne: ['$courier', null] },
                          { $ne: ['$courier', ''] }
                        ]
                      }
                    }
                  },
                  { $project: { _id: 0, courier: 1 } },
                  { $limit: 1 }
                ],
                as: 'peerCouriers'
              }
            },

            // Use existing courier or get from peers
            {
              $set: {
                courier: {
                  $ifNull: [
                    '$courier',
                    { $first: '$peerCouriers.courier' }
                  ]
                }
              }
            },

            {
              $project: {
                _id: 1,
                source: 1,
                poNumber: '$po_number',
                dispatchDate: 1,
                labelStatus: 1,
                invoiceNumber: 1,
                manifestStatus: 1,
                awbNumber: 1,
                manifestId: 1,
                courier: 1, 
                docketId: 1,
                buyerId: 1, // Already available in the data
                warehouseCode: {
                  $ifNull: ['$poDetails.warehouseCode', '$data.poDetails.warehouseCode']
                },
                location:{
                  $ifNull: ['$data.poDetails.location', '$data.location']
                },
                // Get deliveredTo from the existing structure
                deliveredTo: {
                  $ifNull: [
                    '$data.poDetails.deliveredTo', 
                    ''
                  ]
                },

                // Simplified items processing - use existing data
                items: {
                  $map: {
                    input: {
                      $cond: [
                        { $and: ['$data.items', { $isArray: '$data.items' }] },
                        '$data.items',
                        {
                          $cond: [
                            { $and: ['$data.poDetails.items', { $isArray: '$data.poDetails.items' }] },
                            '$data.poDetails.items',
                            { $ifNull: ['$items', []] }
                          ]
                        }
                      ]
                    },
                    as: 'item',
                    in: {
                      itemCode: { $ifNull: ['$$item.itemCode', ''] },
                      quantity: { 
  $convert: {
    input: {
      $replaceAll: {
        input: { $toString: { $ifNull: ['$$item.quantity', '0'] } },  // ✅ Correct reference
        find: ',',
        replacement: ''
      }
    },
    to: 'int',
    onError: 0,
    onNull: 0
  }
},
                      
                      // Use existing cartons data
                      cartons: { $ifNull: ['$$item.noOfCartons', 0] },
                      
                      // Use existing internal SKU
                      internalSku: { $ifNull: ['$$item.internalSku', ''] },
                      
                      // Use existing dimensions
                      dimensions: { $ifNull: ['$$item.dimensions', null] },
                      
                      // Additional fields that might be useful
                      unitsPerCtn: { $ifNull: ['$$item.unitsPerCtn', 0] },
                      totalAmount: { 
                        $convert: {
                          input: { $ifNull: ['$$item.totalAmount', '0'] },
                          to: 'double',
                          onError: 0,
                          onNull: 0
                        }
                      },
                      taxAmount: { 
                        $convert: {
                          input: { $ifNull: ['$$item.taxAmount', '0'] },
                          to: 'double',
                          onError: 0,
                          onNull: 0
                        }
                      }
                    }
                  }
                }
              }
            }
          ]).toArray();

          return result[0] || null;
        } catch (error) {
          console.error(`[ERROR] Failed to process order ${order._id}:`, {
            orderId: order._id,
            source: order.source,
            awbNumber: order.awbNumber,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return null;
        }
      })
    );

    // Filter out any null results
    const validOrderDetails = orderDetails.filter(order => order !== null);

    console.log(`[DEBUG] Processing summary for docketId ${docketId}:`);
    console.log(`[DEBUG] - Orders found: ${orders.length}`);
    console.log(`[DEBUG] - Valid orders: ${validOrderDetails.length}`);

    if (validOrderDetails.length === 0) {
      return res.status(404).json({ 
        message: 'Failed to process orders for this docket',
        docketId
      });
    }

    return res.status(200).json({
      docketId,
      orders: validOrderDetails,
      meta: {
        totalOrdersFound: orders.length,
        ordersProcessed: validOrderDetails.length,
        ordersFailed: orders.length - validOrderDetails.length
      }
    });

  } catch (error) {
    console.error('Docket shipping manifest aggregation error:', {
      docketId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    });
  }
};

export default requirePermission('shipping')(handler);