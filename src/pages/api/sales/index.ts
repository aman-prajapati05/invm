// api/sales
import type { NextApiResponse } from 'next'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { requirePermission, type AuthenticatedRequest } from '@/lib/middleware/authMiddleware'

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
        const db = await connectToDatabase()
        const collection = db.collection('sales')

        switch (req.method) {
            /**
             * GET - Fetch all sales
             */
            case 'GET': {
                try {
                    const sales = await collection.find({}).sort({ saleDate: -1 }).toArray()
                    return res.status(200).json(sales)
                } catch (error) {
                    console.error('Error fetching sales:', error)
                    return res.status(500).json({ message: 'Failed to fetch sales' })
                }
            }

            case 'POST': {
                try {
                    const { productId, batchId, productName, batchCode, quantitySold, saleDate } = req.body

                    if (!productId || !batchId || !quantitySold) {
                        return res.status(400).json({ message: 'Missing required fields' })
                    }

                    // Validate batch
                    const batch = await db.collection('batches').findOne({ _id: new ObjectId(batchId) })
                    if (!batch) {
                        return res.status(404).json({ message: 'Batch not found' })
                    }

                    if (quantitySold > batch.quantity) {
                        return res.status(400).json({ message: `Cannot sell more than available (${batch.quantity})` })
                    }

                    // Insert into sales
                    const saleData = {
                        productId: new ObjectId(productId),
                        batchId: new ObjectId(batchId),
                        productName,
                        batchCode,
                        quantitySold,
                        saleDate: saleDate ? new Date(saleDate) : new Date(),
                        createdAt: new Date(),
                    }

                    const result = await collection.insertOne(saleData)

                    // Decrement batch quantity
                    await db.collection('batches').updateOne(
                        { _id: new ObjectId(batchId) },
                        { $inc: { quantity: -quantitySold }, $set: { updatedAt: new Date() } }
                    )

                    return res.status(201).json({ message: 'Sale recorded', saleId: result.insertedId })
                } catch (error) {
                    console.error('Error creating sale:', error)
                    return res.status(500).json({ message: 'Failed to record sale' })
                }
            }


            /**
             * PUT - Update sale
             */
            case 'PUT': {
                try {
                    const { id, ...updateData } = req.body
                    if (!id) return res.status(400).json({ message: 'Sale ID is required' })

                    updateData.updatedAt = new Date()

                    const result = await collection.updateOne(
                        { _id: new ObjectId(id) },
                        { $set: updateData }
                    )

                    return res.status(200).json({
                        message: 'Sale updated',
                        modifiedCount: result.modifiedCount,
                    })
                } catch (error) {
                    console.error('Error updating sale:', error)
                    return res.status(500).json({ message: 'Failed to update sale' })
                }
            }

            /**
             * DELETE - Remove sale
             */
            case 'DELETE': {
                try {
                    const { id } = req.body
                    if (!id) return res.status(400).json({ message: 'Sale ID is required' })

                    const result = await collection.deleteOne({ _id: new ObjectId(id) })
                    return res.status(200).json({
                        message: 'Sale deleted',
                        deletedCount: result.deletedCount,
                    })
                } catch (error) {
                    console.error('Error deleting sale:', error)
                    return res.status(500).json({ message: 'Failed to delete sale' })
                }
            }

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
                return res.status(405).json({ message: `Method ${req.method} not allowed` })
        }
    } catch (error) {
        console.error('Database connection error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

export default (handler)
