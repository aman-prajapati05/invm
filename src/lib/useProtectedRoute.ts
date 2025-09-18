'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function useProtectedRoute(requiredPermissions?: string[]) {
  const { user, accessToken, hydrated } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Don't do anything until auth context is hydrated
    if (!hydrated) return;

    // console.log('Protected route check:', { user, accessToken, hydrated });

    // Check authentication status
    if (!user || !accessToken) {
      // console.log('Not authenticated, redirecting to login');
      router.replace('/login');
      return;
    }

    // Check permissions if required
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(p => {
        // Handle both string array and object permissions
        if (Array.isArray(user?.permissions)) {
          return user.permissions.includes(p as string);
        } else if (user?.permissions && typeof user.permissions === 'object') {
          return (user.permissions as any)[p] === true;
        }
        return false;
      });
      if (!hasPermission) {
        // console.log('Insufficient permissions, redirecting to unauthorized');
        router.replace('/unauthorized');
        return;
      }
    }

    // All checks passed
    // console.log('Authentication and permissions check passed');
    setLoading(false);
  }, [user, accessToken, hydrated, router, requiredPermissions]);

  return loading; // `true` while checking, `false` when ready
}