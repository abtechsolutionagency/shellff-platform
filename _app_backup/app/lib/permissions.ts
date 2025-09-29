
import { UserType } from '@prisma/client';

export interface Permission {
  resource: string;
  action: string;
}

export const ADMIN_PERMISSIONS: Permission[] = [
  { resource: 'codes', action: 'read' },
  { resource: 'codes', action: 'create' },
  { resource: 'codes', action: 'update' },
  { resource: 'codes', action: 'delete' },
  { resource: 'codes', action: 'refund' },
  { resource: 'revenue', action: 'read' },
  { resource: 'revenue', action: 'export' },
  { resource: 'users', action: 'read' },
  { resource: 'users', action: 'manage' },
  { resource: 'discounts', action: 'read' },
  { resource: 'discounts', action: 'create' },
  { resource: 'discounts', action: 'update' },
  { resource: 'discounts', action: 'delete' },
  { resource: 'analytics', action: 'read' },
  { resource: 'system', action: 'configure' },
];

export const CREATOR_PERMISSIONS: Permission[] = [
  { resource: 'releases', action: 'create' },
  { resource: 'releases', action: 'read' },
  { resource: 'releases', action: 'update' },
  { resource: 'codes', action: 'create' },
  { resource: 'codes', action: 'read' },
  { resource: 'analytics', action: 'read' },
];

export const LISTENER_PERMISSIONS: Permission[] = [
  { resource: 'music', action: 'read' },
  { resource: 'playlists', action: 'create' },
  { resource: 'playlists', action: 'read' },
  { resource: 'playlists', action: 'update' },
  { resource: 'codes', action: 'redeem' },
];

export function getUserPermissions(userType: UserType): Permission[] {
  switch (userType) {
    case UserType.ADMIN:
      return [...ADMIN_PERMISSIONS, ...CREATOR_PERMISSIONS, ...LISTENER_PERMISSIONS];
    case UserType.CREATOR:
      return [...CREATOR_PERMISSIONS, ...LISTENER_PERMISSIONS];
    case UserType.LISTENER:
      return LISTENER_PERMISSIONS;
    default:
      return [];
  }
}

export function hasPermission(
  userType: UserType, 
  resource: string, 
  action: string
): boolean {
  const permissions = getUserPermissions(userType);
  return permissions.some(
    p => p.resource === resource && p.action === action
  );
}
