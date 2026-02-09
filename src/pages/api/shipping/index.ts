import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAnyPermission, type AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';


type OrderItem = {
    itemCode: string;
    quantity: number;
    igst: number;
    cgst: number | null;
    taxAmount: number;
    totalAmount: number;
    basicCostPrice: number;
}

type PODetails = {
    poNumber: string;
    poDate: string;
    deliveryDate: string;
    deliveredTo: string;
    paymentTerms: string;
    gstNo: string;
    location: string;
    poExpiryDate: string;
    totalQuantity: number;
    totalValue: number;
}

type Orders = {
    _id?: ObjectId;
    po_number: string;
    source: string;
    data: any;
    poDetails: PODetails;
    items: OrderItem[];
    s3_key: string;
    s3_url: string;
    status?: string; // Optional status field
    picklistStatus?: string; // Optional picklist status field
    courier?: string; // Optional courier field
    invoiceNumber?: string; // Optional invoice number field
    labelStatus?: string; // Optional label status field
    manifestStatus?: string; // Optional manifest status field
    awbNumber?: string; // Optional AWB number field
    manifestId?: string; // Optional manifest ID field
}



const handle = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const db = await connectToDatabase();
    const collection = db.collection<Orders>('orders');

    const method = req.method;

    switch (method) {

case 'GET': {
  try {
    const { buyers, couriers, page = '1', limit = '20' } = req.query;

    const match: any = {
      awbNumber: { $exists: true, $ne: '' }
    };

    if (buyers) {
      const buyerList = (buyers as string).split(',').map(b => b.trim());
      match.source = { $in: buyerList };
    }

    if (couriers) {
      const courierList = (couriers as string).split(',').map(c => c.trim());
      match.courier = { $in: courierList };
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await collection.countDocuments(match);

    const orders = await collection.aggregate([
      { $match: match },

      // ✅ poDate is already a Date in DB — sort directly (newest first)
      { $sort: { 'data.poDetails.poDate': -1, _id: -1 } },

      { $skip: skip },
      { $limit: limitNum },
      {
        $project: {
          _id: 1,
          po_number: 1,
          source: 1,
          courier: 1,
          manifestId: 1,
          awbNumber: 1,
          docketId: 1,
          invoiceNumber: 1,
          poDate: '$data.poDetails.poDate',
          warehouseCode: {
            $ifNull: ['$poDetails.warehouseCode', '$data.poDetails.warehouseCode']
          },
          location: {
            $ifNull: ['$data.poDetails.location', '$poDetails.deliveredTo']
          },
          totalQuantity: {
            $ifNull: [
              {
                $convert: {
                  input: {
                    $replaceAll: {
                      input: { $toString: '$data.poDetails.totalQuantity' },
                      find: ',', replacement: ''
                    }
                  },
                  to: 'double', onError: 0, onNull: 0
                }
              },
              {
                $sum: {
                  $map: {
                    input: { $ifNull: ['$data.items', []] },
                    as: 'item',
                    in: {
                      $convert: {
                        input: {
                          $replaceAll: {
                            input: { $toString: '$$item.quantity' },
                            find: ',', replacement: ''
                          }
                        },
                        to: 'double', onError: 0, onNull: 0
                      }
                    }
                  }
                }
              }
            ]
          },
          totalValue: {
            $ifNull: [
              {
                $convert: {
                  input: {
                    $replaceAll: {
                      input: { $toString: '$data.poDetails.totalValue' },
                      find: ',', replacement: ''
                    }
                  },
                  to: 'double', onError: 0, onNull: 0
                }
              },
              {
                $sum: {
                  $map: {
                    input: { $ifNull: ['$data.items', []] },
                    as: 'item',
                    in: {
                      $convert: {
                        input: {
                          $replaceAll: {
                            input: { $toString: '$$item.totalAmount' },
                            find: ',', replacement: ''
                          }
                        },
                        to: 'double', onError: 0, onNull: 0
                      }
                    }
                  }
                }
              }
            ]
          },
          noOfItems: {
            $cond: [
              { $isArray: '$data.items' },
              { $size: '$data.items' },
              0
            ]
          },
          noOfCartons: {
            $sum: {
              $map: {
                input: { $ifNull: ['$data.items', []] },
                as: 'item',
                in: {
                  $convert: {
                    input: {
                      $replaceAll: {
                        input: { $toString: '$$item.noOfCartons' },
                        find: ',', replacement: ''
                      }
                    },
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

    return res.status(200).json({
      orders,
      count: orders.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      message: 'Orders retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({
      message: 'Failed to fetch orders',
      error
    });
  }
}




        case 'POST': {
            const { po_number, source, data, poDetails, items, s3_key, s3_url } = req.body;

            if (!po_number || !source || !poDetails || !items) {
                return res.status(400).json({ message: 'po_number, source, poDetails, and items are required' });
            }

            const newOrder = {
                po_number,
                source,
                data: data || {},
                poDetails,
                items,
                s3_key: s3_key || '',
                s3_url: s3_url || '',
            };

            const result = await collection.insertOne(newOrder);
            return res.status(201).json({ message: 'Order created', id: result.insertedId });
        }
        case 'PUT': {
            const { orderId, updateData } = req.body;
            if (!orderId || !updateData) {
                return res.status(400).json({ message: 'orderId and updateData are required' });
            }

            const result = await collection
                .updateOne({ _id: new ObjectId(`${orderId}`) }, { $set: updateData });

            if (result.matchedCount === 0) {
                return res.status(404).json({ message: 'Order not found' });
            }

            return res.status(200).json({ message: 'Order updated', id: orderId });
        }
        case 'DELETE': {
            const { orderId } = req.body;
            if (!orderId) {
                return res.status(400).json({ message: 'orderId is required' });
            }

            const result = await collection.deleteOne({ _id: new ObjectId(`${orderId}`) });
            if (result.deletedCount === 0) {
                return res.status(404).json({ message: 'Order not found' });
            }
            return res.status(200).json({ message: 'Order deleted successfully' });
        }
        case 'PATCH': {
            const { orderId, updateData } = req.body;
            if (!orderId || !updateData) {
                return res.status(400).json({ message: 'orderId and updateData are required' });
            }

            const result = await collection
                .updateOne({ _id: new ObjectId(`${orderId}`) }, { $set: updateData });

            if (result.matchedCount === 0) {
                return res.status(404).json({ message: 'Order not found' });
            }

            return res.status(200).json({ message: 'Order updated', id: orderId });
        }
        default:
            return res.status(405).json({ message: 'Method not allowed' });
    }
}
export default requireAnyPermission(['label', 'picklist','shipping'])(handle);
