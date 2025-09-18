import type { NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requirePermission, type AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('products');

    switch (req.method) {
      /**
       * GET - Fetch all products
       */
      case 'GET': {
        try {
          const products = await collection.find({}).toArray();
          return res.status(200).json(products);
        } catch (error) {
          console.error('Error fetching products:', error);
          return res.status(500).json({ message: 'Failed to fetch products' });
        }
      }

      /**
       * POST - Add new product
       */
      case 'POST': {
        try {
          const { name, sku, brand, shelf_life_days, description } = req.body;

          if (!name || !sku || !shelf_life_days) {
            return res.status(400).json({ message: 'Missing required fields' });
          }

          const existing = await collection.findOne({ sku });
          if (existing) {
            return res.status(409).json({ message: 'Product with this SKU already exists' });
          }

          const productData = {
            name,
            sku,
            brand: brand || null,
            shelf_life_days,
            description: description || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = await collection.insertOne(productData);
          return res.status(201).json({ message: 'Product created', productId: result.insertedId });
        } catch (error) {
          console.error('Error creating product:', error);
          return res.status(500).json({ message: 'Failed to create product' });
        }
      }

      /**
       * PUT - Update product
       */
      case 'PUT': {
        try {
          const { id, ...updateData } = req.body;
          if (!id) return res.status(400).json({ message: 'Product ID is required' });

          // Prevent duplicate SKU
          if (updateData.sku) {
            const existingSkuProduct = await collection.findOne({
              sku: updateData.sku,
              _id: { $ne: new ObjectId(id) },
            });
            if (existingSkuProduct) {
              return res.status(409).json({ message: 'Product with this SKU already exists' });
            }
          }

          updateData.updatedAt = new Date();

          const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
          );

          return res.status(200).json({
            message: 'Product updated',
            modifiedCount: result.modifiedCount,
          });
        } catch (error) {
          console.error('Error updating product:', error);
          return res.status(500).json({ message: 'Failed to update product' });
        }
      }

      /**
       * DELETE - Remove product
       */
      case 'DELETE': {
        try {
          const { id } = req.body;
          if (!id) return res.status(400).json({ message: 'Product ID is required' });

          const result = await collection.deleteOne({ _id: new ObjectId(id) });
          return res.status(200).json({
            message: 'Product deleted',
            deletedCount: result.deletedCount,
          });
        } catch (error) {
          console.error('Error deleting product:', error);
          return res.status(500).json({ message: 'Failed to delete product' });
        }
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default (handler);
