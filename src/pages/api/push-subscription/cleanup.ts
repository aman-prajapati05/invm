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
  const collection = db.collection('pushSubscriptions');

  try {
    const subscriptions = await collection.find({}).toArray();
    let deletedCount = 0;
    let checkedCount = 0;

    console.log(`🧹 Starting cleanup of ${subscriptions.length} subscriptions...`);

    // Tiny payload + short TTL (keeps retries short)
    const payload = JSON.stringify({ title: 'Ping', body: 'Validity check' });
    const options = { TTL: 10 as any };

    for (const sub of subscriptions) {
      try {
        checkedCount++;
        await webPush.sendNotification(sub.subscription, payload, options);
        console.log(`✅ Subscription ${sub._id} is valid`);
      } catch (err: any) {
        const code = err?.statusCode || err?.status;
        if (code === 404 || code === 410) {
          // Permanently gone/expired → prune
          console.log(`🗑️ Removing expired subscription ${sub._id} (user ${sub.userId})`);
          await collection.deleteOne({ _id: sub._id });
          deletedCount++;
        } else if (code === 413) {
          // Payload too large → keep sub; just send smaller payloads next time
          console.warn(`⚠️ 413 Payload Too Large for ${sub._id}. Keeping subscription.`);
        } else if (code === 401 || code === 403) {
          // VAPID/auth issue → do NOT delete subs
          console.warn(`⚠️ Auth issue (${code}) while pinging ${sub._id}. Check VAPID keys/domain.`);
        } else {
          console.warn(`⚠️ Unknown send error for ${sub._id}:`, err?.message || err);
        }
      }
    }

    console.log(`🧹 Cleanup complete: checked ${checkedCount}, deleted ${deletedCount} invalid subscriptions`);

    return res.status(200).json({
      message: 'Subscription cleanup complete',
      checked: checkedCount,
      deleted: deletedCount,
    });
  } catch (e) {
    console.error('❌ Error during subscription cleanup:', e);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export default authenticate(handler);
