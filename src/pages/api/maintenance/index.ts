// pages/api/maintenance.ts
import type { NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { authenticate, type AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { hasAllRequiredPermissions } from '@/lib/utils/checkPermission';

type AppConfigDoc = {
  _id: string;
  maintenance: { enabled: boolean };
};

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const db = await connectToDatabase();
  const collection = db.collection<AppConfigDoc>('app_config');
  const { user } = req;

  switch (req.method) {
    // ✅ Anyone logged in can read maintenance state
    case 'GET': {
      const doc = await collection.findOne({ _id: 'global' });
      return res.status(200).json({ enabled: doc?.maintenance?.enabled ?? false });
    }

    // 🔒 Only admin (all perms) can toggle
    case 'POST': {
      if (!user || !hasAllRequiredPermissions(user)) {
        return res.status(403).json({ message: 'Only admins can toggle maintenance mode' });
      }

      const { enabled } = req.body as { enabled: boolean };
      if (enabled === undefined) {
        return res.status(400).json({ message: 'Missing field: enabled' });
      }

      await collection.updateOne(
        { _id: 'global' },
        { $set: { 'maintenance.enabled': enabled } },
        { upsert: true }
      );

      return res.status(200).json({ message: 'Maintenance updated', enabled });
    }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
};

// 👇 just need authentication, not requireAdmin for the whole handler
export default authenticate(handler);
