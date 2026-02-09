import type { NextApiResponse } from 'next';
import type { AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { connectToDatabase } from '@/lib/mongodb';
import { authenticate } from '@/lib/middleware/authMiddleware';
import webPush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webPush.setVapidDetails(
  'mailto:you@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const db = await connectToDatabase();
  const subscriptionsCollection = db.collection('pushSubscriptions');
  const notificationsCollection = db.collection('notifications');

  const { title, body, type = 'generic', userId } = req.body || {};
  if (!title || !body) return res.status(400).json({ message: 'Missing title/body' });

  // Optional targeting by userId
  const query = userId ? { userId: new (await import('mongodb')).ObjectId(userId) } : {};
  const subscriptions = await subscriptionsCollection.find(query).toArray();

  const payload = JSON.stringify({ title, body });
  const options = { TTL: 60 as any }; // keeps retries short

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(sub.subscription, payload, options);

        // Save a record (associate userId if present)
        const notif = {
          type,
          data: body,               // your main message string
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
        await notificationsCollection.insertOne(notif);

        return { userId: sub.userId, success: true };
      } catch (error: any) {
        const code = error?.statusCode || error?.status;

        // Only delete on 404/410 (gone)
        if (code === 404 || code === 410) {
          await subscriptionsCollection.deleteOne({ _id: sub._id });
          console.log(`🗑️ Removed expired subscription for user ${sub.userId}`);
          return { userId: sub.userId, success: false, error: 'expired' };
        }

        // 413 = payload too large -> do NOT delete; just shrink future payloads
        if (code === 413) {
          console.warn('Payload too large (413). Not deleting sub:', sub._id);
          return { userId: sub.userId, success: false, error: 'payload-too-large' };
        }

        // 401/403 usually VAPID config → don’t delete subs
        if (code === 401 || code === 403) {
          console.warn('Auth error (check VAPID keys). Not deleting sub:', sub._id);
          return { userId: sub.userId, success: false, error: `auth-${code}` };
        }

        console.error(`❌ Push send failed for user ${sub.userId}:`, error?.message || error);
        return { userId: sub.userId, success: false, error: 'unknown' };
      }
    })
  );

  res.status(200).json({ message: 'Push attempted', total: subscriptions.length, results });
};


export default authenticate(handler);
