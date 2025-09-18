
import type { NextApiRequest, NextApiResponse } from 'next';
import type { AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { connectToDatabase } from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/middleware/authMiddleware';
import { ObjectId } from 'mongodb';

type OrderItem = {
    itemCode: string;
    quantity: number;
    igst: number;
    cgst: number | null;
    taxAmount: number;
    totalAmount: number;
    basicCostPrice: number;
    cartons?: number;
    internalSku?: string;
    dimensions?: {
        length: number;
        breadth: number;
        height: number;
    };
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
    status?: string;
    picklistStatus?: string;
    courier?: string;
    invoiceNumber?: string;
    labelStatus?: string;
    manifestStatus?: string;
    awbNumber?: string;
    manifestId?: string;
    dispatchDate?: Date;
    processedDate?: Date;
    docketId?: string;
}

const handle = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    if(req.method !== 'POST') {
        res.status(405).end();
        return;
    }
    
    const db = await connectToDatabase();
    const ordersCollection = db.collection<Orders>('orders');
    const { orderId, awbNumber, dispatchDate, courier, isDocket, docketId } = req.body;
    
    console.log('Manifest API - Received request body:', req.body);
    console.log('Manifest API - isDocket:', isDocket, 'docketId:', docketId);
    
    if (!orderId || !awbNumber || !dispatchDate) {
        res.status(400).json({ message: 'Missing required fields: orderId, awbNumber, dispatchDate' });
        return;
    }
    
    try {
        // If this is a docket operation, find all orders with the same docketId
        let ordersToUpdate = [];
        
        if (isDocket && docketId) {
            // Find all orders with this docketId
            console.log('Manifest API - Finding orders for docketId:', docketId);
            const docketOrders = await ordersCollection.find({ docketId: docketId }).toArray();
            console.log('Manifest API - Found docket orders:', docketOrders.length, 'orders');
            if (docketOrders.length === 0) {
                res.status(404).json({ message: 'No orders found for this docket' });
                return;
            }
            ordersToUpdate = docketOrders;
        } else {
            // Single order operation
            const order = await ordersCollection.findOne({ _id: new ObjectId(`${orderId}`) });
            if (!order) {
                res.status(404).json({ message: 'Order not found' });
                return;
            }
            ordersToUpdate = [order];
        }

        // Check if AWB number already exists in any other order (excluding orders to be updated)
        const orderIdsToExclude = ordersToUpdate.map(order => order._id);
        const existingAWB = await ordersCollection.findOne({ 
            awbNumber: awbNumber,
            _id: { $nin: orderIdsToExclude }
        });

        if (existingAWB) {
            res.status(400).json({ message: 'AWB number already exists. Please use a unique AWB number.' });
            return;
        }

        // Generate unique manifest ID using AWB and courier
        const generateManifestId = (awbNumber: string, courier: string) => {
            const awbPart = awbNumber.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase();
            const courierPart = courier.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
            const timestamp = Date.now().toString().slice(-4);
            return `${courierPart}${awbPart}${timestamp}`;
        };

        const manifestId = generateManifestId(awbNumber, courier || ordersToUpdate[0].courier || 'DEFAULT');

        // Update all orders in the batch
        const updatePromises = ordersToUpdate.map(async (order) => {
            // Check if this is the first time adding AWB number for this order
            const isFirstTimeAwb = !order.awbNumber || order.awbNumber === '';
            
            // Update the order with manifest data
            const updateFields: any = {
                awbNumber: awbNumber,
                manifestStatus: 'generated',
                manifestId: manifestId,
                dispatchDate: new Date(dispatchDate),
                ...(courier && { courier: courier })
            };

            // Add processedDate if this is the first time adding AWB number
            if (isFirstTimeAwb) {
                updateFields.processedDate = new Date();
            }

            return ordersCollection.updateOne(
                { _id: order._id },
                { $set: updateFields }
            );
        });

        const updateResults = await Promise.all(updatePromises);
        
        console.log('Manifest API - Update results:', updateResults);
        console.log('Manifest API - Updated orders count:', ordersToUpdate.length);
        
        // Check if all updates were successful
        const failedUpdates = updateResults.filter(result => result.modifiedCount === 0);
        if (failedUpdates.length > 0) {
            console.log('Manifest API - Failed updates:', failedUpdates.length);
            res.status(500).json({ message: 'Failed to update some orders' });
            return;
        }

        console.log('Manifest API - All orders updated successfully');
        res.status(200).json({ 
            message: isDocket ? 'Docket manifest created successfully' : 'Manifest created successfully',
            manifestId: manifestId,
            updatedOrders: ordersToUpdate.length
        });
        
    } catch (error) {
        console.error('Error creating manifest:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export default requireAnyPermission(['label', 'picklist'])(handle);