import { Request, Response } from 'express';
import prisma from '../../config/database';
import { asyncHandler } from '../../middleware/errorHandler';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { CreateRoleInput, UpdateRoleInput } from '../../validators/admin.schema';
import { clearPermissionCache } from '../../middleware/attachAbility';

/**
 * List all roles with counts
 * GET /admin/roles
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  // Check permission
  if (!req.ability?.can('read', 'Role')) {
    throw new ForbiddenError('Insufficient permissions to view roles');
  }

  const { page = 1, limit = 50, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = search
    ? {
        OR: [
          { name: { contains: String(search), mode: 'insensitive' as const } },
          { description: { contains: String(search), mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            policies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: Number(limit),
    }),
    prisma.role.count({ where }),
  ]);

  res.json({
    data: roles,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Get single role by ID
 * GET /admin/roles/:id
 */
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('read', 'Role')) {
    throw new ForbiddenError('Insufficient permissions to view role');
  }

  const role = await prisma.role.findUnique({
    where: { id: req.params.id },
    include: {
      policies: {
        include: {
          policy: {
            include: {
              _count: {
                select: {
                  permissions: true,
                },
              },
            },
          },
        },
      },
      users: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        take: 10, // Limit users shown
      },
      _count: {
        select: {
          users: true,
          policies: true,
        },
      },
    },
  });

  if (!role) {
    throw new NotFoundError('Role not found');
  }

  res.json({ data: role });
});

/**
 * Create new role
 * POST /admin/roles
 */
export const create = asyncHandler(
  async (req: Request<{}, {}, CreateRoleInput>, res: Response) => {
    if (!req.ability?.can('create', 'Role')) {
      throw new ForbiddenError('Insufficient permissions to create role');
    }

    const role = await prisma.role.create({
      data: req.body,
      include: {
        _count: {
          select: {
            users: true,
            policies: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Role created successfully',
      data: role,
    });
  }
);

/**
 * Update role
 * PUT /admin/roles/:id
 */
export const update = asyncHandler(
  async (req: Request<{ id: string }, {}, UpdateRoleInput>, res: Response) => {
    if (!req.ability?.can('update', 'Role')) {
      throw new ForbiddenError('Insufficient permissions to update role');
    }

    const role = await prisma.role.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        _count: {
          select: {
            users: true,
            policies: true,
          },
        },
      },
    });

    // Clear permission cache for this role
    clearPermissionCache(role.name);

    res.json({
      message: 'Role updated successfully',
      data: role,
    });
  }
);

/**
 * Delete role
 * DELETE /admin/roles/:id
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('delete', 'Role')) {
    throw new ForbiddenError('Insufficient permissions to delete role');
  }

  const role = await prisma.role.delete({
    where: { id: req.params.id },
  });

  // Clear permission cache for this role
  clearPermissionCache(role.name);

  res.json({
    message: 'Role deleted successfully',
    data: role,
  });
});

/**
 * Assign policy to role
 * POST /admin/roles/:id/policies
 */
export const assignPolicy = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('update', 'Role')) {
    throw new ForbiddenError('Insufficient permissions to assign policy');
  }

  const { id } = req.params;
  const { policyId } = req.body;

  // Check if role and policy exist
  const [role, policy] = await Promise.all([
    prisma.role.findUnique({ where: { id } }),
    prisma.policy.findUnique({ where: { id: policyId } }),
  ]);

  if (!role) throw new NotFoundError('Role not found');
  if (!policy) throw new NotFoundError('Policy not found');

  // Create association
  await prisma.rolePolicy.create({
    data: {
      roleId: id,
      policyId,
    },
  });

  // Clear permission cache
  clearPermissionCache(role.name);

  res.json({
    message: 'Policy assigned to role successfully',
  });
});

/**
 * Remove policy from role
 * DELETE /admin/roles/:id/policies/:policyId
 */
export const removePolicy = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('update', 'Role')) {
    throw new ForbiddenError('Insufficient permissions to remove policy');
  }

  const { id, policyId } = req.params;

  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw new NotFoundError('Role not found');

  await prisma.rolePolicy.delete({
    where: {
      roleId_policyId: {
        roleId: id,
        policyId,
      },
    },
  });

  // Clear permission cache
  clearPermissionCache(role.name);

  res.json({
    message: 'Policy removed from role successfully',
  });
});
