import type { NextApiResponse } from "next"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { requirePermission, type AuthenticatedRequest } from "@/lib/middleware/authMiddleware"

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const db = await connectToDatabase()
    const productsCollection = db.collection("products")
    const batchesCollection = db.collection("batches")
    const jobsCollection = db.collection("jobs")

    switch (req.method) {
      /**
       * GET - Fetch all batches (optionally by productId)
       */
      case "GET": {
        try {
          const { productId } = req.query

          if (productId) {
            const batches = await batchesCollection
              .find({ productId: new ObjectId(productId as string) })
              .toArray()
            return res.status(200).json(batches)
          }

          // Join batches with product info
          const batches = await batchesCollection
            .aggregate([
              {
                $lookup: {
                  from: "products",
                  localField: "productId",
                  foreignField: "_id",
                  as: "product",
                },
              },
              { $unwind: "$product" },
              {
                $project: {
                  _id: 1,
                  batchCode: 1,
                  quantity: 1,
                  mfg_date: 1,
                  shelf_life_days: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  productId: 1,
                  productName: "$product.name",
                  sku: "$product.sku",
                },
              },
            ])
            .toArray()

          return res.status(200).json(batches)
        } catch (error) {
          console.error("Error fetching batches:", error)
          return res.status(500).json({ message: "Failed to fetch batches" })
        }
      }

      case "POST": {
  try {
    const { productId, batchCode, quantity, mfg_date, shelf_life_days } = req.body
    if (!productId || !batchCode || !quantity || !mfg_date || !shelf_life_days) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const product = await productsCollection.findOne({ _id: new ObjectId(productId) })
    if (!product) return res.status(404).json({ message: "Product not found" })

    // ✅ Check for duplicate batchCode for this product
    const existingBatch = await batchesCollection.findOne({
      productId: new ObjectId(productId),
      batchCode,
    })
    if (existingBatch) {
      return res.status(409).json({ message: "Batch Code already exists for this product" })
    }

    const newBatchId = new ObjectId()
    const mfgDateObj = new Date(mfg_date)
    const expiryDate = new Date(mfgDateObj.getTime() + shelf_life_days * 24 * 60 * 60 * 1000)

    const newBatch = {
      _id: newBatchId,
      productId: new ObjectId(productId),
      batchCode,
      quantity,
      mfg_date: mfgDateObj,
      shelf_life_days,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await batchesCollection.insertOne(newBatch)

    // create expiry reminder job
    const notifyAt = new Date(expiryDate.getTime() - 5 * 24 * 60 * 60 * 1000)

    await jobsCollection.insertOne({
      batchId: newBatchId,
      productId: new ObjectId(productId),
      type: "expiry-reminder",
      notifyAt,
      expiryDate,
      status: "scheduled",
      createdAt: new Date(),
    })

    return res.status(201).json({ message: "Batch created", batch: newBatch })
  } catch (error) {
    console.error("Error creating batch:", error)
    return res.status(500).json({ message: "Failed to create batch" })
  }
}


      /**
       * PUT - Update batch (cancel old job + create new one)
       */
      case "PUT": {
        try {
          const { batchId, ...updateData } = req.body
          if (!batchId) {
            return res.status(400).json({ message: "Batch ID required" })
          }

          updateData.updatedAt = new Date()

          // update batch
          await batchesCollection.updateOne(
            { _id: new ObjectId(batchId) },
            { $set: updateData }
          )

          // cancel old job
          await jobsCollection.updateMany(
            { batchId: new ObjectId(batchId), status: "scheduled" },
            { $set: { status: "cancelled", cancelledAt: new Date() } }
          )

          // if expiry-related fields updated, create new job
          if (updateData.mfg_date && updateData.shelf_life_days) {
            const mfgDateObj = new Date(updateData.mfg_date)
            const expiryDate = new Date(
              mfgDateObj.getTime() + updateData.shelf_life_days * 24 * 60 * 60 * 1000
            )
            const notifyAt = new Date(expiryDate.getTime() - 5 * 24 * 60 * 60 * 1000)

            await jobsCollection.insertOne({
              batchId: new ObjectId(batchId),
              productId: updateData.productId ? new ObjectId(updateData.productId) : undefined,
              type: "expiry-reminder",
              notifyAt,
              expiryDate,
              status: "scheduled",
              createdAt: new Date(),
            })
          }

          return res.status(200).json({ message: "Batch updated" })
        } catch (error) {
          console.error("Error updating batch:", error)
          return res.status(500).json({ message: "Failed to update batch" })
        }
      }

      /**
       * DELETE - Remove batch (and its job)
       */
      case "DELETE": {
        try {
          const { batchId } = req.body
          if (!batchId) {
            return res.status(400).json({ message: "Batch ID required" })
          }

          await batchesCollection.deleteOne({ _id: new ObjectId(batchId) })

          // delete associated jobs
          await jobsCollection.deleteMany({ batchId: new ObjectId(batchId) })

          return res.status(200).json({ message: "Batch and jobs deleted" })
        } catch (error) {
          console.error("Error deleting batch:", error)
          return res.status(500).json({ message: "Failed to delete batch" })
        }
      }

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"])
        return res.status(405).json({ message: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error("Database connection error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export default handler
