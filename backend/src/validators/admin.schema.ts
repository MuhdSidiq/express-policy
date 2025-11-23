import { z } from 'zod';

// ============================================
// ROLE SCHEMAS
// ============================================

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Role name is required').regex(/^[a-z_]+$/, 'Role name must be lowercase letters and underscores only'),
    description: z.string().optional(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1).regex(/^[a-z_]+$/).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

// ============================================
// POLICY SCHEMAS
// ============================================

export const createPolicySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Policy name is required'),
    description: z.string().optional(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updatePolicySchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

// ============================================
// PERMISSION SCHEMAS
// ============================================

export const createPermissionSchema = z.object({
  body: z.object({
    policyId: z.string().min(1, 'Policy ID is required'),
    action: z.enum(['create', 'read', 'update', 'delete', 'manage'], {
      errorMap: () => ({ message: 'Invalid action' }),
    }),
    subject: z.string().min(1, 'Subject is required'),
    fields: z.array(z.string()).optional().default([]),
    conditions: z.record(z.any()).nullable().optional(),
    inverted: z.boolean().optional().default(false),
    reason: z.string().optional(),
  }),
});

export const updatePermissionSchema = z.object({
  body: z.object({
    action: z.enum(['create', 'read', 'update', 'delete', 'manage']).optional(),
    subject: z.string().min(1).optional(),
    fields: z.array(z.string()).optional(),
    conditions: z.record(z.any()).nullable().optional(),
    inverted: z.boolean().optional(),
    reason: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

// ============================================
// USER SCHEMAS
// ============================================

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const assignRoleSchema = z.object({
  body: z.object({
    roleId: z.string().min(1, 'Role ID is required'),
  }),
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

export const assignPolicyToRoleSchema = z.object({
  body: z.object({
    policyId: z.string().min(1, 'Policy ID is required'),
  }),
  params: z.object({
    id: z.string().min(1, 'Role ID is required'),
  }),
});

// ============================================
// QUERY SCHEMAS
// ============================================

export const paginationSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 50)),
    search: z.string().optional(),
  }),
});

// Type exports
export type CreateRoleInput = z.infer<typeof createRoleSchema>['body'];
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>['body'];
export type CreatePolicyInput = z.infer<typeof createPolicySchema>['body'];
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>['body'];
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>['body'];
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>['body'];
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
