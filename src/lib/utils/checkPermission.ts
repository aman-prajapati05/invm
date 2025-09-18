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

export function hasPermission(user: User, permission: PermissionKey) {
  return user?.role === 'admin' || user?.permissions?.[permission] === true;
}

const REQUIRED_PERMS: PermissionKey[] = [
  'dashboard',
  'inventory',
  'picklist',
  'label',
  'shipping',
  'sku',
  'buyer',
  'courier',
  'user',
];

export function hasAllRequiredPermissions(
  user: Pick<User, 'role' | 'permissions'> | { permissions: Record<PermissionKey, boolean> } | null | undefined
) {
  if (!user) return false;
  // allow explicit admin role OR all permissions = true
  if ('role' in user && user.role === 'admin') return true;

  const perms = user.permissions || {};
  return REQUIRED_PERMS.every((k) => perms[k] === true);
}