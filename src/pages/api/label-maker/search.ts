import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/middleware/authMiddleware';
import warehouse from '../warehouse';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Search query is required' });
  }

  const db = await connectToDatabase();
  const collection = db.collection('orders');

  try {
 const results = await collection.aggregate([
  {
    $search: {
      index: 'default',
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
              path: 'source',
              fuzzy: { maxEdits: 1 }
            }
          },
          {
            autocomplete: {
              query,
              path: 'courier',
              fuzzy: { maxEdits: 1 }
            }
          }
        ],
        minimumShouldMatch: 1
      }
    }
  },
  {
    $match: {
      picklistStatus: 'completed'
    }
  },
  { $limit: 20 },
  {
    $project: {
      _id: 1,
      po_number: 1,
      source: 1,
      courier: 1,
      labelStatus: 1,
      manifestStatus: 1,
      docketId: 1,
      poDate: '$data.poDetails.poDate',
      warehouseCode: {
        $ifNull: ['$data.poDetails.warehouseCode', '$poDetails.warehouse']
      },
      location: {
        $ifNull: ['$data.poDetails.location', '$poDetails.deliveredTo']
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
                        input: { $toString: '$$item.quantity' },
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
                    to: 'double',
                    onError: 0,
                    onNull: 0
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

    return res.status(200).json({ 
      orders: results, 
      count: results.length,
      message: 'Search completed successfully'
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ message: 'Failed to search picklist orders', error });
  }
};

export default requireAnyPermission(['label', 'picklist'])(handler);