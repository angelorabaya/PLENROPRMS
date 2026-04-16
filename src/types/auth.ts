export type UserRole = 'Admin' | 'Editor' | 'Viewer';

export interface UserPermissions {
  role: UserRole;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canCancelPayment: boolean;
}

export const normalizeUserRole = (role: unknown): UserRole => {
  if (role === 'Admin' || role === 'Editor' || role === 'Viewer') {
    return role;
  }

  return 'Viewer';
};

export const getRolePermissions = (role: UserRole): UserPermissions => {
  switch (role) {
    case 'Admin':
      return {
        role,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        canCancelPayment: true,
      };
    case 'Editor':
      return {
        role,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: false,
        canCancelPayment: false,
      };
    case 'Viewer':
    default:
      return {
        role: 'Viewer',
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
        canCancelPayment: false,
      };
  }
};
