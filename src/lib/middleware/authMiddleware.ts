// lib/api/authMiddleware.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { hasAllRequiredPermissions } from '@/lib/utils/checkPermission';

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error('Missing JWT_SECRET');



export interface UserPermissions {
  dashboard: boolean;
  inventory: boolean;
  picklist: boolean;
  label: boolean;
  shipping: boolean;
  sku: boolean;
  buyer: boolean;
  courier: boolean;
  user: boolean;
}

export interface AuthenticatedRequest extends NextApiRequest {
  user?: { userId: string; permissions: UserPermissions; tv: number };
  authUser?: any;
}

export function authenticate(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 'NO_TOKEN', message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        permissions: UserPermissions;
        tv?: number;
      };

      const db = await connectToDatabase();
      const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
      if (!user) {
        return res.status(403).json({ code: 'ACCOUNT_DELETED', message: 'Account deleted' });
      }
      if (user.status !== 'active') {
        return res.status(403).json({ code: 'ACCOUNT_DEACTIVATED', message: 'Account deactivated' });
      }

      const dbTV = typeof user.tokenVersion === 'number' ? user.tokenVersion : 0;
      const tokTV = typeof decoded.tv === 'number' ? decoded.tv : 0;
      if (tokTV !== dbTV) {
        return res.status(401).json({ code: 'TOKEN_VERSION_MISMATCH', message: 'Session invalidated' });
      }

      (req as AuthenticatedRequest).user = { userId: decoded.userId, permissions: decoded.permissions, tv: tokTV };
      (req as AuthenticatedRequest).authUser = user;
      return handler(req as AuthenticatedRequest, res);
    } catch {
      return res.status(401).json({ code: 'INVALID_OR_EXPIRED', message: 'Invalid or expired token' });
    }
  };
}

// — helpers unchanged —
export function hasPermission(req: AuthenticatedRequest, permission: keyof UserPermissions): boolean {
  return req.user?.permissions?.[permission] === true;
}
export function requirePermission(permission: keyof UserPermissions) {
  return function (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void) {
    return authenticate(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!hasPermission(req, permission)) {
        return res.status(403).json({ code: 'PERMISSION_DENIED', message: `Access denied. Required permission: ${permission}` });
      }
      return handler(req, res);
    });
  };
}
export function requirePermissions(permissions: (keyof UserPermissions)[]) {
  return function (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void) {
    return authenticate(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      const missing = permissions.filter(p => !hasPermission(req, p));
      if (missing.length > 0) {
        return res.status(403).json({ code: 'PERMISSION_DENIED', message: `Access denied. Missing permissions: ${missing.join(', ')}` });
      }
      return handler(req, res);
    });
  };
}
export function requireAnyPermission(permissions: (keyof UserPermissions)[]) {
  return function (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void) {
    return authenticate(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      const ok = permissions.some(p => hasPermission(req, p));
      if (!ok) {
        return res.status(403).json({ code: 'PERMISSION_DENIED', message: `Access denied. Required at least one of: ${permissions.join(', ')}` });
      }
      return handler(req, res);
    });
  };
}
export function requireAdmin(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void) {
  return authenticate(async (req, res) => {
    if (!req.user || !hasAllRequiredPermissions(req.user)) {
      return res.status(403).json({ code: 'ADMIN_REQUIRED', message: 'Access denied. Admin required' });
    }
    return handler(req, res);
  });
}
