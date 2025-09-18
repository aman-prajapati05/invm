import type { NextApiRequest, NextApiResponse } from 'next';
import { AuthenticatedRequest, requireAnyPermission } from '@/lib/middleware/authMiddleware';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';


type OrderItem = {
    itemCode: string;
    quantity: number | string; // Can be string with commas
    igst: number | string;
    cgst: number | string | null;
    taxAmount: number | string;
    totalAmount: number | string;
    basicCostPrice: number | string;
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
    totalQuantity: number | string; // Can be string with commas
    totalValue: number | string; // Can be string with commas
}

// Structured data type instead of 'any'
type OrderData = {
    poDetails: PODetails;
    items: OrderItem[];
    status?: string;
    [key: string]: any; // For additional fields
}

type Orders = {
    _id?: ObjectId;
    po_number: string;
    source: string;
    data: OrderData; // Much better than 'any'
    poDetails?: PODetails; // Optional since it's mainly in data.poDetails
    items?: OrderItem[]; // Optional since it's mainly in data.items
    s3_key: string;
    s3_url: string;
    status?: string;
    picklistStatus?: string;
    courier?: string;
    invoiceNumber?: string;
    labelStatus?: string;
    manifestStatus?: string;
}

// Query parameters type
type QueryParams = {
    buyers?: string;
    statuses?: string;
    page?: string;
    limit?: string;
}

// API Response types
type OrdersResponse = {
    orders: Array<{
        _id: ObjectId;
        po_number: string;
        source: string;
        courier?: string;
        labelStatus?: string;
        manifestStatus?: string;
        poDate: string;
        location: string;
        totalQuantity: number;
        totalValue: number;
        noOfItems: number;
        noOfCartons: number;
    }>;
    count: number;
    total: number;
    page: number;
    totalPages: number;
    message: string;
}

type ErrorResponse = {
    message: string;
    error?: string;
    details?: string;
}

// Buyer and BuyerProduct types for lookups
type Buyer = {
    _id: ObjectId;
    buyerId: string;
    buyerName: string;
    [key: string]: any;
}

type BuyerProduct = {
    _id: ObjectId;
    buyerId: string;
    buyerItemCode: string;
    unitsPerCtn: number | string;
    [key: string]: any;
}


const handle = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const db = await connectToDatabase();
    const collection = db.collection<Orders>('orders');

    const method = req.method;

    switch (method) {
case 'GET': {
  try {
    const { buyers, statuses, manifestStatus, labelStatus, courier, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, Math.min(1000, parseInt(page as string, 10) || 1));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 10));

  if (labelStatus && typeof labelStatus !== 'string') return res.status(400).json({ message: 'labelStatus must be a string' });
  if (manifestStatus && typeof manifestStatus !== 'string') return res.status(400).json({ message: 'manifestStatus must be a string' });
  if (courier && typeof courier !== 'string') return res.status(400).json({ message: 'courier must be a string' });
  if (buyers && typeof buyers !== 'string') return res.status(400).json({ message: 'buyers must be a string' });
  if (statuses && typeof statuses !== 'string') return res.status(400).json({ message: 'statuses must be a string' });

    const match: any = { picklistStatus: 'completed' };

    if (buyers) {
      const buyerList = buyers.split(',').map(b => b.trim()).filter(Boolean);
      if (buyerList.length > 0) match.source = { $in: buyerList };
    }

    if (statuses) {
      const statusList = statuses.split(',').map(s => s.trim()).filter(Boolean);
      if (statusList.length > 0) match.status = { $in: statusList };
    }

    if (labelStatus) {
      const labelList = labelStatus.split(',').map(s => s.trim()).filter(Boolean);
      if (labelList.length > 0) match.labelStatus = { $in: labelList };
    }

    if (manifestStatus) {
      const manifestList = manifestStatus.split(',').map(s => s.trim()).filter(Boolean);
      if (manifestList.length > 0) match.manifestStatus = { $in: manifestList };
    }
    
    if (courier) {
      const courierList = courier.split(',').map(s => s.trim()).filter(Boolean);
      if (courierList.length > 0) match.courier = { $in: courierList };
    }

    // Get total count for pagination metadata
    const total = await collection.countDocuments(match);

    // Step 1: Get all orders sorted by date and create logical grouping
    const allOrdersSorted = await collection.aggregate([
      { $match: match },
      {
        $addFields: {
          sortDate: {
            $dateFromString: {
              dateString: '$data.poDetails.poDate',
              onError: new Date('1970-01-01')
            }
          }
        }
      },
      { $sort: { sortDate: -1, _id: -1 } },
      {
        $project: {
          _id: 1,
          po_number: 1,
          source: 1,
          courier: 1,
          labelStatus: 1,
          manifestStatus: 1,
          poDate: '$data.poDetails.poDate',
          docketId: 1,
          sortDate: 1,
          location: {
            $ifNull: ['$data.poDetails.location', '$poDetails.deliveredTo']
          },
          warehouseCode:{
            $ifNull: ['$data.poDetails.warehouseCode', '$poDetails.warehouseCode']
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
                  to: 'double',
                  onError: 0, onNull: 0
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

    // Step 2: Group dockets and create logical rows
    const processedOrders: any[] = [];
    const processedDockets = new Set<string>();

    for (const order of allOrdersSorted) {
      if (order.docketId && !processedDockets.has(order.docketId)) {
        // This is a docket that hasn't been processed yet
        const docketOrders = allOrdersSorted.filter(o => o.docketId === order.docketId);
        
        // Sort docket orders by date (latest first)
        docketOrders.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());
        
        const firstOrder = docketOrders[0];
        
        const docketRow = {
          ...firstOrder,
          id: `docket-${order.docketId}`,
          po_number: docketOrders.map(o => o.po_number).join(', '),
          totalQuantity: docketOrders.reduce((sum, o) => sum + (o.totalQuantity || 0), 0),
          totalValue: docketOrders.reduce((sum, o) => sum + (o.totalValue || 0), 0),
          noOfItems: docketOrders.reduce((sum, o) => sum + (o.noOfItems || 0), 0),
          noOfCartons: docketOrders.reduce((sum, o) => sum + (o.noOfCartons || 0), 0),
          isDocket: true,
          docketOrders: docketOrders,
          sortDate: firstOrder.sortDate
        };
        
        processedOrders.push(docketRow);
        processedDockets.add(order.docketId);
        
      } else if (!order.docketId) {
        // Individual order (not part of any docket)
        processedOrders.push(order);
      }
      // Skip orders that are part of already processed dockets
    }

    // Step 3: Sort the final processed orders by date
    processedOrders.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

    // Step 4: Apply pagination to the grouped result
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedOrders = processedOrders.slice(startIndex, endIndex);

    // Calculate pagination metadata based on processed orders
    const totalProcessedOrders = processedOrders.length;
    const totalPages = Math.ceil(totalProcessedOrders / limitNum);

    return res.status(200).json({
      orders: paginatedOrders,
      count: paginatedOrders.length,
      total: totalProcessedOrders,
      originalTotal: total, // Original count before grouping
      page: pageNum,
      totalPages,
      message: 'Orders retrieved successfully',
      debug: {
        originalOrdersCount: allOrdersSorted.length,
        processedOrdersCount: totalProcessedOrders,
        docketsProcessed: processedDockets.size,
        startIndex,
        endIndex
      }
    });

  } catch (error) {
    console.error('GET /api/orders error:', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      query: req.query,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
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

            return res.status(200).json({ message: 'Order updated', id: orderId, poNumber: updateData.poNumber });
        }
        default:
            return res.status(405).json({ message: 'Method not allowed' });
    }
}
export default (handle);