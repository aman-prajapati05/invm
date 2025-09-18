import type { NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { AuthenticatedRequest, requirePermission } from '@/lib/middleware/authMiddleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (req.method !== 'GET' && req.method !== 'PUT') {
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  if (!id || typeof id !== 'string' || !ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  const db = await connectToDatabase();

  // Handle PUT request for updating shipping manifest
  if (req.method === 'PUT') {
    try {
      const { invoiceNumber, awbNumber } = req.body;

      // Validate that at least one field is provided
      if (!invoiceNumber && !awbNumber) {
        return res.status(400).json({ message: 'At least one field (invoiceNumber or awbNumber) is required' });
      }

      // Build update object dynamically
      const updateFields: any = {};
      if (invoiceNumber !== undefined) updateFields.invoiceNumber = invoiceNumber;
      if (awbNumber !== undefined) updateFields.awbNumber = awbNumber;

      // Update the order
      const updateResult = await db.collection('orders').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateFields }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }

      return res.status(200).json({ 
        message: 'Shipping manifest updated successfully',
        updated: updateFields
      });
    } catch (error) {
      console.error('Error updating shipping manifest:', error);
      return res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  // Handle GET request for fetching shipping manifest
  try {
const result = await db.collection('orders').aggregate([
  { $match: { _id: new ObjectId(id) } },
  {
    $project: {
      _id: 0,
      source: 1,
      poNumber: '$po_number',
      courier: 1,
      dispatchDate: 1,
      labelStatus: 1,
      invoiceNumber: 1,
      manifestStatus: 1,
      awbNumber: 1,
      manifestId: 1,
      warehouseCode: {
        $ifNull: ['$poDetails.warehouseCode', '$data.poDetails.warehouseCode']
      },
      location: {
        $ifNull: ['$poDetails.location', '$data.poDetails.location']
      },
      deliveredTo: {
        $ifNull: ['$poDetails.deliveredTo', '$data.poDetails.deliveredTo']
      },
      items: {
        $map: {
          input: {
            $cond: {
              if: { $and: ['$data.items', { $isArray: '$data.items' }] },
              then: '$data.items',
              else: []
            }
          },
          as: 'item',
          in: {
            itemCode: { $ifNull: ['$$item.itemCode', ''] },
            quantity: { $ifNull: ['$$item.quantity', 0] },
            cartons: {
              $convert: {
                input: {
                  $replaceAll: {
                    input: { $toString: '$$item.noOfCartons' },
                    find: ',', replacement: ''
                  }
                },
                to: 'double',
                onError: null,
                onNull: null
              }
            },
            internalSku: { $ifNull: ['$$item.internalSku', null] },
            dimensions: {
              $cond: [
                { $ne: ['$$item.dimensions', null] },
                {
                  length: { $ifNull: ['$$item.dimensions.length', null] },
                  breadth: { $ifNull: ['$$item.dimensions.breadth', null] },
                  height: { $ifNull: ['$$item.dimensions.height', null] }
                },
                null
              ]
            }
          }
        }
      },
            totalValue: {
        $sum: {
          $map: {
            input: '$_itemsArr',
            as: 'item',
            in: {
              $convert: {
                input: {
                  $replaceAll: {
                    input: { $toString: '$$item.totalAmount' }, // supports string/number
                    find: ',', replacement: ''                    // strip thousand separators
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


    if (!result.length) {
      console.warn(`[⚠️] Order not found: ${id}`);
      return res.status(404).json({ message: 'Order not found' });
    }

    const response = result[0];

    // ✅ Console logging for dev
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] Item codes in order:', response.debugItemInput?.map((i: any) => i.itemCode));
      console.log('[DEBUG] Buyer item codes:', response.debugBuyerProducts?.map((p: any) => p.buyerItemCode));
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('🔥 Aggregation error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export default requirePermission('shipping')(handler);