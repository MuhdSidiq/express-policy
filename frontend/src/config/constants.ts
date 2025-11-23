export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Permission Management System';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ADMIN: {
    ROLES: '/admin/roles',
    POLICIES: '/admin/policies',
    USERS: '/admin/users',
    AUDIT_LOGS: '/admin/audit-logs',
    PERMISSION_MATRIX: '/admin/permission-matrix',
  },
  ORDERS: '/orders',
  PRODUCTS: '/products',
} as const;

export const PERMISSIONS = {
  ACTIONS: ['create', 'read', 'update', 'delete', 'manage'] as const,
  SUBJECTS: ['User', 'Role', 'Policy', 'Permission', 'Order', 'Product', 'AuditLog', 'all'] as const,
};
