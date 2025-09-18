import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/middleware/authMiddleware';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Search query is required' });
  }

  const db = await connectToDatabase();
  const collection = db.collection('orders');

  try {
    let results: any[] = [];

    // First try Atlas Search if available
    try {
    results = await collection.aggregate([
  {
    $search: {
      index: 'default',
      compound: {
        should: [
          { autocomplete: { query, path: 'po_number', fuzzy: { maxEdits: 1 } } },
          { autocomplete: { query, path: 'manifestId', fuzzy: { maxEdits: 1 } } },
          { autocomplete: { query, path: 'awbNumber', fuzzy: { maxEdits: 1 } } },
          { autocomplete: { query, path: 'courier', fuzzy: { maxEdits: 1 } } },
          { autocomplete: { query, path: 'source', fuzzy: { maxEdits: 1 } } },
          { autocomplete: { query, path: 'data.poDetails.location', fuzzy: { maxEdits: 1 } } }
        ],
        minimumShouldMatch: 1
      }
    }
  },
  { $match: { awbNumber: { $exists: true, $ne: '' } } },
  { $limit: 50 },
  {
    $project: {
      _id: 1,
      po_number: 1,
      poNumber: { $ifNull: ['$po_number', '$poNumber'] },
      source: 1,
      courier: 1,
      manifestId: 1,
      awbNumber: 1,
      docketId: 1,
      invoiceNumber: 1,
      warehouseCode:{
        $ifNull: ['$data.poDetails.warehouseCode', '$poDetails.warehouseCode', '$warehouseCode']
      },
      poDate: {
        $ifNull: ['$data.poDetails.poDate', '$poDetails.poDate', '$poDate']
      },
      location: {
        $ifNull: ['$data.poDetails.location', '$poDetails.deliveredTo', '$location']
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
                    to: 'double', onError: 0, onNull: 0
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
                    to: 'double', onError: 0, onNull: 0
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

    } catch (atlasSearchError) {
      console.log('Atlas Search not available, falling back to text search:', atlasSearchError);
      
      // Fallback to regular MongoDB text search and regex
      const searchRegex = new RegExp(query, 'i');
      
      results = await collection.aggregate([
        {
          $match: {
            $and: [
              {
                awbNumber: { $exists: true, $ne: '' } // Only fetch orders with AWB numbers
              },
              {
                $or: [
                  { po_number: searchRegex },
                  { poNumber: searchRegex },
                  { manifestId: searchRegex },
                  { awbNumber: searchRegex },
                  { courier: searchRegex },
                  { source: searchRegex },
                  { 'data.poDetails.location': searchRegex },
                  { 'poDetails.location': searchRegex },
                  { location: searchRegex }
                ]
              }
            ]
          }
        },
        { $limit: 50 },
        {
          $lookup: {
            from: 'buyers',
            localField: 'source',
            foreignField: 'buyerName',
            as: 'buyerInfo'
          }
        },
        {
          $set: {
            buyerId: { $arrayElemAt: ['$buyerInfo._id', 0] }
          }
        },
        {
          $lookup: {
            from: 'buyer_products',
            let: { buyerId: '$buyerId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$buyerId', '$$buyerId'] }
                }
              }
            ],
            as: 'buyerProducts'
          }
        },
        {
          $project: {
            _id: 1,
            po_number: 1,
            poNumber: { $ifNull: ['$po_number', '$poNumber'] },
            source: 1,
            courier: 1,
            manifestId: 1,
            invoiceNumber:1,
            warehouseCode:{
              $ifNull: ['$data.poDetails.warehouseCode', '$poDetails.warehouseCode', '$warehouseCode']
            },
            awbNumber: 1,
            docketId: 1,
            poDate: {
              $ifNull: [
                '$data.poDetails.poDate',
                '$poDetails.poDate',
                '$poDate'
              ]
            },
            location: {
              $ifNull: [
                '$data.poDetails.location', 
                '$poDetails.deliveredTo',
                '$location'
              ]
            },
            totalQuantity: {
              $ifNull: [
                '$data.poDetails.totalQuantity',
                '$poDetails.totalQuantity',
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
                              find: ',',
                              replacement: ''
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
                '$data.poDetails.totalValue',
                '$poDetails.totalValue',
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
                              find: ',',
                              replacement: ''
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
                    $let: {
                      vars: {
                        matchedProduct: {
                          $first: {
                            $filter: {
                              input: '$buyerProducts',
                              as: 'bp',
                              cond: {
                                $eq: [
                                  { $toString: '$$bp.buyerItemCode' },
                                  { $toString: '$$item.itemCode' }
                                ]
                              }
                            }
                          }
                        }
                      },
                      in: {
                        $cond: [
                          {
                            $and: [
                              '$$matchedProduct',
                              { 
                                $gt: [
                                  {
                                    $convert: {
                                      input: '$$matchedProduct.unitsPerCtn',
                                      to: 'double',
                                      onError: 0,
                                      onNull: 0
                                    }
                                  }, 
                                  0
                                ] 
                              }
                            ]
                          },
                          {
                            $round: [
                              {
                                $divide: [
                                  {
                                    $convert: {
                                      input: {
                                        $replaceAll: {
                                          input: { $toString: '$$item.quantity' },
                                          find: ',',
                                          replacement: ''
                                        }
                                      },
                                      to: 'double',
                                      onError: 0,
                                      onNull: 0
                                    }
                                  },
                                  {
                                    $convert: {
                                      input: '$$matchedProduct.unitsPerCtn',
                                      to: 'double',
                                      onError: 1,
                                      onNull: 1
                                    }
                                  }
                                ]
                              },
                              0
                            ]
                          },
                          0
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]).toArray();
    }

    return res.status(200).json({ 
      orders: results, 
      count: results.length,
      message: 'Search completed successfully'
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ message: 'Failed to search shipping manifests', error });
  }
};

export default requireAnyPermission(['shipping', 'label', 'picklist'])(handler);
