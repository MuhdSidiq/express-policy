import { Request, Response } from 'express';
import prisma from '../../config/database';
import { asyncHandler } from '../../middleware/errorHandler';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { CreatePermissionInput, UpdatePermissionInput } from '../../validators/admin.schema';
import { clearPermissionCache } from '../../middleware/attachAbility';

/**
 * List all permissions
 * GET /admin/permissions
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('read', 'Permission')) {
    throw new ForbiddenError('Insufficient permissions to view permissions');
  }

  const { policyId } = req.query;

  const where = policyId ? { policyId: String(policyId) } : {};

  const permissions = await prisma.permission.findMany({
    where,
    include: {
      policy: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({ data: permissions });
});

/**
 * Create new permission
 * POST /admin/permissions
 */
export const create = asyncHandler(
  async (req: Request<{}, {}, CreatePermissionInput>, res: Response) => {
    if (!req.ability?.can('create', 'Permission')) {
      throw new ForbiddenError('Insufficient permissions to create permission');
    }

    const permission = await prisma.permission.create({
      data: req.body,
      include: {
        policy: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    // Clear cache for all roles using this policy
    for (const rolePolicy of permission.policy.roles) {
      clearPermissionCache(rolePolicy.role.name);
    }

    res.status(201).json({
      message: 'Permission created successfully',
      data: permission,
    });
  }
);

/**
 * Update permission
 * PUT /admin/permissions/:id
 */
export const update = asyncHandler(
  async (req: Request<{ id: string }, {}, UpdatePermissionInput>, res: Response) => {
    if (!req.ability?.can('update', 'Permission')) {
      throw new ForbiddenError('Insufficient permissions to update permission');
    }

    const permission = await prisma.permission.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        policy: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    // Clear cache for all roles using this policy
    for (const rolePolicy of permission.policy.roles) {
      clearPermissionCache(rolePolicy.role.name);
    }

    res.json({
      message: 'Permission updated successfully',
      data: permission,
    });
  }
);

/**
 * Delete permission
 * DELETE /admin/permissions/:id
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('delete', 'Permission')) {
    throw new ForbiddenError('Insufficient permissions to delete permission');
  }

  // Get permission with policy and roles before deletion
  const permission = await prisma.permission.findUnique({
    where: { id: req.params.id },
    include: {
      policy: {
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  });

  if (!permission) {
    throw new NotFoundError('Permission not found');
  }

  await prisma.permission.delete({
    where: { id: req.params.id },
  });

  // Clear cache for all roles using this policy
  for (const rolePolicy of permission.policy.roles) {
    clearPermissionCache(rolePolicy.role.name);
  }

  res.json({
    message: 'Permission deleted successfully',
    data: permission,
  });
});

/**
 * Get permission matrix for visualization
 * GET /admin/permission-matrix
 */
export const getMatrix = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('read', 'Permission')) {
    throw new ForbiddenError('Insufficient permissions to view permission matrix');
  }

  // Get all roles with their policies and permissions
  const roles = await prisma.role.findMany({
    where: { isActive: true },
    include: {
      policies: {
        include: {
          policy: {
            include: {
              permissions: true,
            },
          },
        },
      },
    },
  });

  // Extract unique subjects and actions
  const subjectsSet = new Set<string>();
  const actionsSet = new Set<string>();

  roles.forEach(role => {
    role.policies.forEach(rp => {
      rp.policy.permissions.forEach(perm => {
        subjectsSet.add(perm.subject);
        actionsSet.add(perm.action);
      });
    });
  });

  const subjects = Array.from(subjectsSet);
  const actions = Array.from(actionsSet);

  // Build matrix
  const matrix: Record<string, Record<string, Record<string, boolean>>> = {};

  roles.forEach(role => {
    matrix[role.name] = {};

    subjects.forEach(subject => {
      matrix[role.name][subject] = {};

      actions.forEach(action => {
        // Check if role has this permission
        const hasPermission = role.policies.some(rp =>
          rp.policy.permissions.some(
            perm =>
              (perm.subject === subject || perm.subject === 'all') &&
              (perm.action === action || perm.action === 'manage') &&
              !perm.inverted
          )
        );

        matrix[role.name][subject][action] = hasPermission;
      });
    });
  });

  res.json({
    data: {
      roles: roles.map(r => r.name),
      subjects,
      actions,
      matrix,
    },
  });
});

/**
 * Test if a user has a specific permission
 * POST /admin/permission-test
 */
export const testPermission = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('read', 'Permission')) {
    throw new ForbiddenError('Insufficient permissions to test permissions');
  }

  const { userId, action, subject, subjectData } = req.body;

  // Get user with roles
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              policies: {
                include: {
                  policy: {
                    include: {
                      permissions: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Build ability for user
  const { AbilityBuilderService } = await import('../../services/abilityBuilder');
  const abilityBuilder = new AbilityBuilderService(prisma);
  const ability = await abilityBuilder.defineAbilityFor(user);

  // Test permission
  const allowed = subjectData
    ? ability.can(action, subject, subjectData)
    : ability.can(action, subject);

  // Find matched policies
  const matchedPolicies: string[] = [];
  const appliedConditions: any = {};

  user.roles.forEach(ur => {
    ur.role.policies.forEach(rp => {
      const matchingPerms = rp.policy.permissions.filter(
        perm =>
          (perm.subject === subject || perm.subject === 'all') &&
          (perm.action === action || perm.action === 'manage')
      );

      if (matchingPerms.length > 0) {
        matchedPolicies.push(rp.policy.name);
        matchingPerms.forEach(perm => {
          if (perm.conditions) {
            Object.assign(appliedConditions, perm.conditions);
          }
        });
      }
    });
  });

  res.json({
    allowed,
    reason: allowed
      ? `User has permission via: ${matchedPolicies.join(', ')}`
      : 'User does not have permission',
    matchedPolicies,
    appliedConditions,
  });
});
