import type { NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { requirePermission, type AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { sendWelcomeEmail } from '@/lib/email';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const db = await connectToDatabase();
  const collection = db.collection('users');
  const { user } = req;

  switch (req.method) {
    case 'GET': {
      const users = await collection.find({}).toArray();
      return res.status(200).json(users);
    }

    case 'POST': {
      const { name, email, password, role, status, permissions } = req.body;

      if (!name || !email || !password|| !status || !permissions) {
        return res.status(400).json({ message: 'Missing fields' });
      }

      const existing = await collection.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: 'Email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const userData = {
        name,
        email,
        passwordHash,
        status,
        permissions,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(userData);
      return res.status(201).json({ message: 'User created', userId: result.insertedId });
    }

    case 'PUT': {
      const { id, ...updateData } = req.body;

      if (!id) return res.status(400).json({ message: 'User ID is required' });

      // Check if email is being updated and if it already exists
      if (updateData.email) {
        const existingEmailUser = await collection.findOne({ 
          email: updateData.email,
          _id: { $ne: new ObjectId(id) } // Exclude the current user from the check
        });
        
        if (existingEmailUser) {
          return res.status(409).json({ message: 'Email already exists' });
        }
      }

      if (updateData.password) {
        updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
        delete updateData.password;
      }

      const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
      return res.status(200).json({ message: 'User updated', modifiedCount: result.modifiedCount });
    }

    case 'DELETE': {
      const { id } = req.body;
      if (!id) return res.status(400).json({ message: 'User ID is required' });

      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ message: 'User deleted', deletedCount: result.deletedCount });
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
};

export default requirePermission('user')(handler);
