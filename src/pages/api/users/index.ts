import type { NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { requirePermission, type AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { sendWelcomeEmail } from '@/lib/email';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    // Connect to database with error handling
    let db;
    try {
      db = await connectToDatabase();
    } catch (dbError:any) {
      console.error('Database connection failed:', dbError);
      return res.status(500).json({ 
        message: 'Database connection failed', 
        error: process.env.NODE_ENV === 'development' ? dbError.message : 'Internal server error'
      });
    }

    const collection = db.collection('users');
    const { user } = req;

    switch (req.method) {
      case 'GET': {
        try {
          const users = await collection.find({}).toArray();
          return res.status(200).json(users);
        } catch (error:any) {
          console.error('Error fetching users:', error);
          return res.status(500).json({ 
            message: 'Failed to fetch users',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }
      }

      case 'POST': {
        try {
          const { name, email, password, role, status, permissions } = req.body;

          // Validate required fields
          if (!name || !email || !password || !status || !permissions) {
            return res.status(400).json({ 
              message: 'Missing required fields',
              required: ['name', 'email', 'password', 'status', 'permissions']
            });
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
          }

          // Validate password strength
          if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
          }

          // Check if user already exists
          try {
            const existing = await collection.findOne({ email });
            if (existing) {
              return res.status(409).json({ message: 'Email already exists' });
            }
          } catch (error) {
            console.error('Error checking existing user:', error);
            return res.status(500).json({ message: 'Error validating user data' });
          }

          // Hash password
          let passwordHash;
          try {
            passwordHash = await bcrypt.hash(password, 10);
          } catch (error) {
            console.error('Error hashing password:', error);
            return res.status(500).json({ message: 'Error processing password' });
          }

          const userData = {
            name,
            email,
            passwordHash,
            role: role || 'user', // Default role
            status,
            permissions,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Insert user
          try {
            const result = await collection.insertOne(userData);
            
            // Send welcome email (non-blocking)
            try {
              await sendWelcomeEmail(email, name);
            } catch (emailError) {
              console.error('Failed to send welcome email:', emailError);
              // Don't fail the user creation if email fails
            }

            return res.status(201).json({ 
              message: 'User created successfully', 
              userId: result.insertedId 
            });
          } catch (error) {
            console.error('Error creating user:', error);
            return res.status(500).json({ message: 'Failed to create user' });
          }
        } catch (error:any) {
          console.error('Unexpected error in POST:', error);
          return res.status(500).json({ 
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
      }

      case 'PUT': {
        try {
          const { id, ...updateData } = req.body;

          if (!id) {
            return res.status(400).json({ message: 'User ID is required' });
          }

          // Validate ObjectId format
          if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
          }

          // Check if user exists
          try {
            const existingUser = await collection.findOne({ _id: new ObjectId(id) });
            if (!existingUser) {
              return res.status(404).json({ message: 'User not found' });
            }
          } catch (error) {
            console.error('Error finding user:', error);
            return res.status(500).json({ message: 'Error validating user' });
          }

          // Validate email if being updated
          if (updateData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updateData.email)) {
              return res.status(400).json({ message: 'Invalid email format' });
            }

            try {
              const existingEmailUser = await collection.findOne({ 
                email: updateData.email,
                _id: { $ne: new ObjectId(id) }
              });
              
              if (existingEmailUser) {
                return res.status(409).json({ message: 'Email already exists' });
              }
            } catch (error) {
              console.error('Error checking email uniqueness:', error);
              return res.status(500).json({ message: 'Error validating email' });
            }
          }

          // Hash password if being updated
          if (updateData.password) {
            if (updateData.password.length < 6) {
              return res.status(400).json({ message: 'Password must be at least 6 characters long' });
            }

            try {
              updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
              delete updateData.password;
            } catch (error) {
              console.error('Error hashing password:', error);
              return res.status(500).json({ message: 'Error processing password' });
            }
          }

          // Add updated timestamp
          updateData.updatedAt = new Date();

          try {
            const result = await collection.updateOne(
              { _id: new ObjectId(id) }, 
              { $set: updateData }
            );

            if (result.matchedCount === 0) {
              return res.status(404).json({ message: 'User not found' });
            }

            return res.status(200).json({ 
              message: 'User updated successfully', 
              modifiedCount: result.modifiedCount 
            });
          } catch (error) {
            console.error('Error updating user:', error);
            return res.status(500).json({ message: 'Failed to update user' });
          }
        } catch (error:any) {
          console.error('Unexpected error in PUT:', error);
          return res.status(500).json({ 
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
      }

      case 'DELETE': {
        try {
          const { id } = req.body;
          
          if (!id) {
            return res.status(400).json({ message: 'User ID is required' });
          }

          // Validate ObjectId format
          if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
          }
          
          // Prevent deleting the current user
          if (user && user.userId === id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
          }

          try {
            const result = await collection.deleteOne({ _id: new ObjectId(id) });
            
            if (result.deletedCount === 0) {
              return res.status(404).json({ message: 'User not found' });
            }

            return res.status(200).json({ 
              message: 'User deleted successfully', 
              deletedCount: result.deletedCount 
            });
          } catch (error) {
            console.error('Error deleting user:', error);
            return res.status(500).json({ message: 'Failed to delete user' });
          }
        } catch (error:any) {
          console.error('Unexpected error in DELETE:', error);
          return res.status(500).json({ 
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
          });
        }
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ 
          message: `Method ${req.method} not allowed`,
          allowed: ['GET', 'POST', 'PUT', 'DELETE']
        });
    }
  } catch (error:any) {
    console.error('Unexpected error in handler:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : 'Something went wrong'
    });
  }
};

export default handler;