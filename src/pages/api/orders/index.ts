import type { NextApiRequest, NextApiResponse } from 'next';
import type {  AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { connectToDatabase } from '@/lib/mongodb';
import { authenticate, requirePermission } from '@/lib/middleware/authMiddleware';
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
}

const handle = async(req: AuthenticatedRequest, res: NextApiResponse) => {
    const db = await connectToDatabase();
    const collection = db.collection<Orders>('orders');

    const method = req.method;

    switch (method) {
        case 'GET': {
            try {
                const { buyers, statuses, page = '1', limit = '10', startDate, endDate } = req.query;

                const match: any = {};

                // Filters
                if (buyers) {
                    const buyerList = (buyers as string).split(',').map(b => b.trim());
                    match.source = { $in: buyerList };
                }

                if (statuses) {
                    const statusList = (statuses as string).split(',').map(s => s.trim());
                    match['status'] = { $in: statusList };
                }
                if (startDate || endDate) {
  match['data.poDetails.poDate'] = {};

  if (startDate) {
    match['data.poDetails.poDate'].$gte = new Date(startDate as string);
  }

  if (endDate) {
    match['data.poDetails.poDate'].$lte = new Date(endDate as string);
  }
}

                // Pagination
                const pageNum = parseInt(page as string, 10) || 1;
                const limitNum = parseInt(limit as string, 10) || 10;
                const skip = (pageNum - 1) * limitNum;

                // 🔍 ADD LOGGING FOR DEBUGGING
                console.log('🔍 Pagination params:', { page: pageNum, limit: limitNum, skip });
                console.log('🔍 Match filters:', match);

                const total = await collection.countDocuments(match);
                console.log('📊 Total documents:', total);

                const orders = await collection.aggregate([
                    { $match: match },
                    { $sort: { 'data.poDetails.poDate': -1, _id: -1 } }, // Sort by converted date in descending order
                    { $skip: skip },
                    { $limit: limitNum },
                    {
                        $project: {
                            _id: 1,
                            po_number: 1,
                            source: 1,
                            s3_url: 1,
                            status: 1,
                            poDate: '$data.poDetails.poDate',
                            poNumber: '$data.poDetails.poNumber',
                            warehouse: {
                                $ifNull: ['$data.poDetails.warehouseCode', '']
                            },
                            location: {
                                $ifNull: ['$data.poDetails.location', '$poDetails.deliveredTo']
                            },
                            poExpiryDate: '$data.poDetails.poExpiryDate',
                            totalQuantity: {
                                $ifNull: ['$data.poDetails.totalQuantity', { $sum: '$data.items.quantity' }]
                            },
                            totalValue: {
                                $ifNull: ['$data.poDetails.totalValue', { $sum: '$data.items.totalAmount' }]
                            },
                            noOfItems: {
                                $cond: [{ $isArray: '$data.items' }, { $size: '$data.items' }, 0]
                            },
                            // Don't include the temporary sortDate field in the response
                        },
                    }
                ]).toArray();

                console.log('📋 Query returned orders:', orders.length);
                console.log('📅 First order date:', orders[0]?.poDate);
                console.log('📅 Last order date:', orders[orders.length - 1]?.poDate);

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

export default requirePermission('orders')(handle);