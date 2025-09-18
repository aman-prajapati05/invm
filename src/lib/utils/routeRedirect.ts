// lib/utils/routeRedirect.ts
type PermissionKey =
  | 'dashboard'
  | 'inventory'
  | 'picklist'
  | 'label'
  | 'shipping'
  | 'sku'
  | 'buyer'
  | 'courier'
  | 'user';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'inactive';
    permissions: {
        dashboard?: boolean;
        inventory?: boolean;
        picklist?: boolean;
        label?: boolean;
        shipping?: boolean;
        sku?: boolean;
        buyer?: boolean;
        courier?: boolean;
        user?: boolean;
    };
}

function hasPermission(user: User, permission: PermissionKey) {
  return user?.role === 'admin' || user?.permissions?.[permission] === true;
}

const ROUTE_PERMISSIONS = [
  { path: '/', permission: 'dashboard' as PermissionKey },
  { path: '/inventory', permission: 'inventory' as PermissionKey },
  { path: '/label', permission: 'label' as PermissionKey },
  { path: '/shipping', permission: 'shipping' as PermissionKey },
  { path: '/sku', permission: 'sku' as PermissionKey },
  { path: '/buyer', permission: 'buyer' as PermissionKey },
  { path: '/courier', permission: 'courier' as PermissionKey },
  { path: '/user', permission: 'user' as PermissionKey },
];

export function getRedirectRoute(user: User, currentPath: string): string | null {
  // If user is on dashboard but doesn't have dashboard permission
  if (currentPath === '/' && !hasPermission(user, 'dashboard')) {
    // Find first route they have permission for
    for (const route of ROUTE_PERMISSIONS.slice(1)) { // Skip dashboard
      if (hasPermission(user, route.permission)) {
        return route.path;
      }
    }
  }
  return null;
}