import type { NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requirePermission, type AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const db = await connectToDatabase();
    const jobsCollection = db.collection('jobs');
    const batchesCollection = db.collection('batches');
    const productsCollection = db.collection('products');

    switch (req.method) {
      /**
       * GET - Fetch expiry jobs with batch and product details
       */
      case 'GET': {
        try {
          const { status, type, upcoming } = req.query;

          // Build query filters
          const matchStage: any = {};
          
          if (status) {
            matchStage.status = status;
          }
          
          if (type) {
            matchStage.type = type;
          } else {
            // Default to expiry-reminder jobs
            matchStage.type = 'expiry-reminder';
          }

          // If upcoming is specified, filter by upcoming notifications
          if (upcoming === 'true') {
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + 30); // Next 30 days
            
            matchStage.notifyAt = {
              $gte: now,
              $lte: futureDate
            };
            matchStage.status = 'scheduled';
          }

          // Aggregate jobs with batch and product information
          const jobs = await jobsCollection.aggregate([
            { $match: matchStage },
            {
              $lookup: {
                from: 'batches',
                localField: 'batchId',
                foreignField: '_id',
                as: 'batch'
              }
            },
            { $unwind: '$batch' },
            {
              $lookup: {
                from: 'products',
                localField: 'productId',
                foreignField: '_id',
                as: 'product'
              }
            },
            { $unwind: '$product' },
            {
              $project: {
                _id: 1,
                batchId: 1,
                productId: 1,
                type: 1,
                notifyAt: 1,
                expiryDate: 1,
                status: 1,
                createdAt: 1,
                // Batch information
                batchCode: '$batch.batchCode',
                quantity: '$batch.quantity',
                mfg_date: '$batch.mfg_date',
                shelf_life_days: '$batch.shelf_life_days',
                // Product information
                productName: '$product.name',
                sku: '$product.sku',
                category: '$product.category',
                // Calculate days until expiry
                daysUntilExpiry: {
                  $divide: [
                    { $subtract: ['$expiryDate', new Date()] },
                    1000 * 60 * 60 * 24
                  ]
                }
              }
            },
            { $sort: { expiryDate: 1 } } // Sort by expiry date ascending
          ]).toArray();

          return res.status(200).json(jobs);
        } catch (error) {
          console.error('Error fetching expiry jobs:', error);
          return res.status(500).json({ 
            message: 'Failed to fetch expiry jobs',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
          });
        }
      }

      /**
       * PUT - Update job status (mark as notified, snoozed, etc.)
       */
      case 'PUT': {
        try {
          const { jobId, status, snoozeUntil } = req.body;

          if (!jobId) {
            return res.status(400).json({ message: 'Job ID is required' });
          }

          if (!ObjectId.isValid(jobId)) {
            return res.status(400).json({ message: 'Invalid job ID format' });
          }

          const updateData: any = {
            status,
            updatedAt: new Date()
          };

          // If snoozing, set the new notify time
          if (status === 'snoozed' && snoozeUntil) {
            updateData.notifyAt = new Date(snoozeUntil);
            updateData.snoozedAt = new Date();
          }

          // If marking as notified, record when it was notified
          if (status === 'notified') {
            updateData.notifiedAt = new Date();
          }

          const result = await jobsCollection.updateOne(
            { _id: new ObjectId(jobId) },
            { $set: updateData }
          );

          if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Job not found' });
          }

          return res.status(200).json({ 
            message: 'Job updated successfully',
            modifiedCount: result.modifiedCount 
          });
        } catch (error) {
          console.error('Error updating job:', error);
          return res.status(500).json({ 
            message: 'Failed to update job',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
          });
        }
      }

      /**
       * POST - Create a new expiry reminder job
       */
      case 'POST': {
        try {
          const { batchId, productId, notifyAt, expiryDate } = req.body;

          if (!batchId || !productId || !notifyAt || !expiryDate) {
            return res.status(400).json({ 
              message: 'Missing required fields',
              required: ['batchId', 'productId', 'notifyAt', 'expiryDate']
            });
          }

          // Validate ObjectIds
          if (!ObjectId.isValid(batchId) || !ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid ID format' });
          }

          // Check if batch exists
          const batch = await batchesCollection.findOne({ _id: new ObjectId(batchId) });
          if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
          }

          const newJob = {
            batchId: new ObjectId(batchId),
            productId: new ObjectId(productId),
            type: 'expiry-reminder',
            notifyAt: new Date(notifyAt),
            expiryDate: new Date(expiryDate),
            status: 'scheduled',
            createdAt: new Date()
          };

          const result = await jobsCollection.insertOne(newJob);

          return res.status(201).json({ 
            message: 'Expiry reminder job created',
            jobId: result.insertedId 
          });
        } catch (error) {
          console.error('Error creating job:', error);
          return res.status(500).json({ 
            message: 'Failed to create job',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
          });
        }
      }

      /**
       * DELETE - Cancel/delete a job
       */
      case 'DELETE': {
        try {
          const { jobId } = req.body;

          if (!jobId) {
            return res.status(400).json({ message: 'Job ID is required' });
          }

          if (!ObjectId.isValid(jobId)) {
            return res.status(400).json({ message: 'Invalid job ID format' });
          }

          const result = await jobsCollection.deleteOne({ _id: new ObjectId(jobId) });

          if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Job not found' });
          }

          return res.status(200).json({ 
            message: 'Job deleted successfully',
            deletedCount: result.deletedCount 
          });
        } catch (error) {
          console.error('Error deleting job:', error);
          return res.status(500).json({ 
            message: 'Failed to delete job',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
          });
        }
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ 
          message: `Method ${req.method} not allowed`,
          allowed: ['GET', 'POST', 'PUT', 'DELETE']
        });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Something went wrong'
    });
  }
};

export default handler;