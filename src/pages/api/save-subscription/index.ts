import type { NextApiResponse } from 'next';
import type { AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { connectToDatabase } from '@/lib/mongodb';
import { authenticate,  } from '@/lib/middleware/authMiddleware';
import { ObjectId } from 'mongodb';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const db = await connectToDatabase();
  const collection = db.collection('pushSubscriptions');

  try {
    const subscription = req.body;
    const userId = req.user?.userId; // Optional: associate with a user

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }

    // Check for existing subscription by endpoint
    const existingByEndpoint = await collection.findOne({ 
      'subscription.endpoint': subscription.endpoint 
    });
    
    if (existingByEndpoint) {
      // Update the existing subscription with new data and timestamp
      const updateResult = await collection.updateOne(
        { 'subscription.endpoint': subscription.endpoint },
        { 
          $set: { 
            subscription,
            userId: userId ? new ObjectId(userId) : null,
            updatedAt: new Date() 
          } 
        }
      );
      
      return res.status(200).json({ 
        message: 'Subscription updated', 
        id: existingByEndpoint._id,
        updated: true
      });
    }

    // If user has an existing different subscription, remove it first
    if (userId) {
      const existingByUser = await collection.findOne({ 
        userId: new ObjectId(userId),
        'subscription.endpoint': { $ne: subscription.endpoint }
      });
      
      if (existingByUser) {
        await collection.deleteOne({ _id: existingByUser._id });
        console.log(`🗑️ Removed old subscription for user ${userId}`);
      }
    }

    // Insert new subscription
    const result = await collection.insertOne({
      userId: userId ? new ObjectId(userId) : null,
      subscription,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json({ 
      message: 'Subscription saved', 
      id: result.insertedId,
      created: true
    });
  } catch (err) {
    console.error('❌ Error saving subscription:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};


export default authenticate(handler);