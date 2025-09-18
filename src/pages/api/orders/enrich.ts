import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requirePermission } from '@/lib/middleware/authMiddleware';


const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orderId, status } = req.body;
  if (!orderId || !status) {
    return res.status(400).json({ message: 'orderId and status are required' });
  }

  const db = await connectToDatabase();
  const orders = db.collection('orders');

  const order = await orders.findOne({ _id: new ObjectId(orderId) });
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const buyerId = order.data?.buyerId || order.buyerId;
  if (!buyerId) {
    return res.status(400).json({ message: 'buyerId not found in order' });
  }

  if (!order.data?.items || !Array.isArray(order.data.items)) {
    return res.status(400).json({ message: 'Order has no items to enrich' });
  }

  console.log('🔍 OrderId:', orderId);
  console.log('🔍 Status received:', status);
  console.log('🔍 Raw buyerId:', buyerId);
  console.log('🔍 Items to enrich:', order.data.items.map((i: any) => i.itemCode));

  // If not approved, just update the status
  if (status !== 'approved') {
    await orders.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status } }
    );
    return res.status(200).json({ message: `Order status updated to ${status}` });
  }

//   // Aggregation to enrich data.items
//   const enriched = await orders.aggregate([
//     { $match: { _id: new ObjectId(orderId) } },
//     { $unwind: '$data.items' },
//     {
//       $lookup: {
//         from: 'buyer_products',
//         let: {
//           buyerId: new ObjectId(buyerId),
//           itemCode: { $toString: '$data.items.itemCode' }
//         },
//         pipeline: [
//           {
//             $match: {
//               $expr: {
//                 $and: [
//                   { $eq: ['$buyerId', '$$buyerId'] },
//                   { $eq: [{ $toString: '$buyerItemCode' }, '$$itemCode'] }
//                 ]
//               }
//             }
//           },
//           { $project: { productId: 1 } }
//         ],
//         as: 'bp'
//       }
//     },
//     {
//       $addFields: {
//         productObjectId: {
//           $toObjectId: { $arrayElemAt: ['$bp.productId', 0] }
//         }
//       }
//     },
//     {
//       $lookup: {
//         from: 'sku_master',
//         localField: 'productObjectId',
//         foreignField: '_id',
//         as: 'sku'
//       }
//     },
//     {
//       $addFields: {
//         sku: { $arrayElemAt: ['$sku', 0] }
//       }
//     },
//     {
//       $addFields: {
//         'data.items.internalSku': '$sku.internalSku',
//         'data.items.unitsPerCtn': { $arrayElemAt: ['$bp.unitsPerCtn', 0] },
//         'data.items.dimensions': '$sku.dimensions'
//       }
//     },
//     {
//       $group: {
//         _id: '$_id',
//         items: { $push: '$data.items' }
//       }
//     }
//   ]).toArray();
// const enriched = await orders.aggregate([
//   { $match: { _id: new ObjectId(orderId) } },
//   { $unwind: '$data.items' },
//   {
//     $lookup: {
//       from: 'buyer_products',
//       let: {
//         buyerId: new ObjectId(buyerId),
//         itemCode: { $toString: '$data.items.itemCode' }
//       },
//       pipeline: [
//         {
//           $match: {
//             $expr: {
//               $and: [
//                 { $eq: ['$buyerId', '$$buyerId'] },
//                 { $eq: [{ $toString: '$buyerItemCode' }, '$$itemCode'] }
//               ]
//             }
//           }
//         },
//         {
//           $project: {
//             productId: 1,
//             unitsPerCtn: 1
//           }
//         }
//       ],
//       as: 'bp'
//     }
//   },
//   {
//     $addFields: {
//       productObjectId: {
//         $toObjectId: { $arrayElemAt: ['$bp.productId', 0] }
//       }
//     }
//   },
//   {
//     $lookup: {
//       from: 'sku_master',
//       localField: 'productObjectId',
//       foreignField: '_id',
//       as: 'sku'
//     }
//   },
//   {
//     $addFields: {
//       sku: { $arrayElemAt: ['$sku', 0] }
//     }
//   },
//   {
//     $addFields: {
//       'data.items.internalSku': '$sku.internalSku',
//       'data.items.dimensions': '$sku.dimensions',
//       'data.items.unitsPerCtn': { $arrayElemAt: ['$bp.unitsPerCtn', 0] }
//     }
//   },
//   {
//     $group: {
//       _id: '$_id',
//       items: { $push: '$data.items' }
//     }
//   }
// ]).toArray();

const enriched = await orders.aggregate([
  { $match: { _id: new ObjectId(orderId) } },
  { $unwind: '$data.items' },
  {
    $lookup: {
      from: 'buyer_products',
      let: {
        buyerId: new ObjectId(buyerId),
        itemCode: { $toString: '$data.items.itemCode' }
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$buyerId', '$$buyerId'] },
                { $eq: [{ $toString: '$buyerItemCode' }, '$$itemCode'] }
              ]
            }
          }
        },
        {
          $project: {
            productId: 1,
            unitsPerCtn: 1
          }
        }
      ],
      as: 'bp'
    }
  },
  {
    $addFields: {
      productObjectId: {
        $toObjectId: { $arrayElemAt: ['$bp.productId', 0] }
      }
    }
  },
  {
    $lookup: {
      from: 'sku_master',
      localField: 'productObjectId',
      foreignField: '_id',
      as: 'sku'
    }
  },
  {
    $addFields: {
      sku: { $arrayElemAt: ['$sku', 0] }
    }
  },
  {
    $addFields: {
      'data.items.internalSku': '$sku.internalSku',
      'data.items.dimensions': '$sku.dimensions',
      'data.items.unitsPerCtn': { $arrayElemAt: ['$bp.unitsPerCtn', 0] },
      'data.items.noOfCartons': {
        $cond: [
          {
            $and: [
              { $gt: [{ $ifNull: [{ $arrayElemAt: ['$bp.unitsPerCtn', 0] }, 0] }, 0] },
              { $gt: ['$data.items.quantity', 0] }
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
                          input: { $toString: '$data.items.quantity' },
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
                      input: {
                        $replaceAll: {
                          input: { $toString: { $arrayElemAt: ['$bp.unitsPerCtn', 0] } },
                          find: ',',
                          replacement: ''
                        }
                      },
                      to: 'double',
                      onError: 1,
                      onNull: 1
                    }
                  }
                ]
              },
              2
            ]
          },
          0
        ]
      }
    }
  },
  {
    $group: {
      _id: '$_id',
      items: { $push: '$data.items' }
    }
  }
]).toArray();



  console.log('🧪 Aggregation result:', JSON.stringify(enriched[0], null, 2));

  if (!enriched[0]) {
    return res.status(500).json({ message: 'Aggregation failed — no data enriched' });
  }

  // Update order with enriched items and status
  await orders.updateOne(
    { _id: new ObjectId(orderId) },
    {
      $set: {
        status: 'approved',
        picklistStatus: 'approved',
        'data.items': enriched[0].items
      }
    }
  );

  return res.status(200).json({
    message: 'Order enriched and approved successfully',
    updatedItems: enriched[0].items
  });
};

export default requirePermission('orders')(handler);

