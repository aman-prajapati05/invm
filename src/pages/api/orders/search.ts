// /pages/api/orders/search.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { authenticate, requirePermission } from '@/lib/middleware/authMiddleware';


async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req.query;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Search query is required' });
  }

  const db = await connectToDatabase();
  const collection = db.collection('orders');

const results = await collection.aggregate([
  {
    $search: {
      index: 'default', // or your index name
      compound: {
        should: [
          {
            autocomplete: {
              query,
              path: 'po_number',
              fuzzy: { maxEdits: 1 }
            }
          },
          {
            autocomplete: {
              query,
              path: 'poDetails.poNumber',
              fuzzy: { maxEdits: 1 }
            }
          },
          {
            autocomplete: {
              query,
              path: 'poDetails.deliveredTo',
              fuzzy: { maxEdits: 1 }
            }
          },
          {
            autocomplete: {
              query,
              path: 'poDetails.location',
              fuzzy: { maxEdits: 1 }
            }
          },
          {
            autocomplete: {
              query,
              path: 'source',
              fuzzy: { maxEdits: 1 }
            }
          }
        ]
      }
    }
  },
  { $limit: 20 },
  {
    $project: {
      _id: 1,
      po_number: 1,
      source: 1,
      s3_url: 1,
      status: 1,
      poDate: '$data.poDetails.poDate',
      warehouse: '$data.poDetails.warehouseCode',
      poNumber: '$data.poDetails.poNumber',
      location: '$data.poDetails.location',
      poExpiryDate: '$data.poDetails.poExpiryDate',
      totalQuantity: '$data.poDetails.totalQuantity',
      totalValue: '$data.poDetails.totalValue',
      noOfItems: { $size: '$data.items' }
    }
  }
]).toArray();

  return res.status(200).json(results);
}

export default requirePermission('orders')(handler);
