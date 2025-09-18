import type { NextApiRequest, NextApiResponse } from 'next';
import type { AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { connectToDatabase } from '@/lib/mongodb';
import { requirePermission } from '@/lib/middleware/authMiddleware';

const handle = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const db = await connectToDatabase();
        const collection = db.collection('orders');

        const { startDate, endDate } = req.query;

        // Date range logic
        let actualStartDate: Date;
        let actualEndDate: Date;

        if (startDate && endDate) {
            actualStartDate = new Date(startDate as string);
            actualEndDate = new Date(endDate as string);
        } else {
            // Default: last 5 days (today back to 5 days ago)
            actualEndDate = new Date();
            actualStartDate = new Date();
            actualStartDate.setDate(actualStartDate.getDate() - 5);
        }

        // Simple date filter that works with Date objects
        const dateFilter = {
            "data.poDetails.poDate": {
                $gte: actualStartDate,
                $lte: actualEndDate
            }
        };

        console.log('📊 Stats date range:', { 
            startDate: actualStartDate.toISOString(), 
            endDate: actualEndDate.toISOString() 
        });

        // Use individual countDocuments queries instead of aggregation
        console.log('🔍 Using individual queries...');
        
        const [
            newOrders,
            expiredOrders,
            labelsPrinted,
            priceMismatch,
            posApproved,
            onHold,
            posRollOver,
            picklistGenerated
        ] = await Promise.all([
            collection.countDocuments({
                ...dateFilter,
                status: "new-order"
            }),
            collection.countDocuments({
                ...dateFilter,
                status: "expired"
            }),
            collection.countDocuments({
                ...dateFilter,
                labelStatus: "printed"
            }),
            collection.countDocuments({
                ...dateFilter,
                "validationErrors": {
                    $elemMatch: {
                        "error": { $regex: "Cost mismatch", $options: "i" }
                    }
                }
            }),
            collection.countDocuments({
                ...dateFilter,
                status: "approved"
            }),
            collection.countDocuments({
                ...dateFilter,
                status: "on-hold"
            }),
            collection.countDocuments({
                ...dateFilter,
                picklistStatus: "rollover"
            }),
            collection.countDocuments({
                ...dateFilter,
                picklistStatus: "approved"
            })
        ]);

        const result = {
            newOrders,
            expiredOrders,
            labelsPrinted,
            priceMismatch,
            posApproved,
            onHold,
            posRollOver,
            picklistGenerated
        };

        // console.log('📈 Individual query results:', result);

        return res.status(200).json({
            ...result,
            dateRange: {
                startDate: actualStartDate.toISOString().split('T')[0],
                endDate: actualEndDate.toISOString().split('T')[0]
            },
            message: 'Order statistics retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching order stats:', error);
        return res.status(500).json({
            message: 'Failed to fetch order statistics',
            error: error instanceof Error ? error.message : error
        });
    }
};

export default requirePermission('dashboard')(handle);