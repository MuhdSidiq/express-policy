import { Request, Response } from 'express';
import prisma from '../../config/database';
import { asyncHandler } from '../../middleware/errorHandler';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { CreatePolicyInput, UpdatePolicyInput } from '../../validators/admin.schema';
import { clearPermissionCache } from '../../middleware/attachAbility';

/**
 * List all policies
 * GET /admin/policies
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('read', 'Policy')) {
    throw new ForbiddenError('Insufficient permissions to view policies');
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

  const [policies, total] = await Promise.all([
    prisma.policy.findMany({
      where,
      include: {
        _count: {
          select: {
            permissions: true,
            roles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: Number(limit),
    }),
    prisma.policy.count({ where }),
  ]);

  res.json({
    data: policies,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Get single policy by ID with permissions
 * GET /admin/policies/:id
 */
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('read', 'Policy')) {
    throw new ForbiddenError('Insufficient permissions to view policy');
  }

  const policy = await prisma.policy.findUnique({
    where: { id: req.params.id },
    include: {
      permissions: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      roles: {
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
      _count: {
        select: {
          permissions: true,
          roles: true,
        },
      },
    },
  });

  if (!policy) {
    throw new NotFoundError('Policy not found');
  }

  res.json({ data: policy });
});

/**
 * Create new policy
 * POST /admin/policies
 */
export const create = asyncHandler(
  async (req: Request<{}, {}, CreatePolicyInput>, res: Response) => {
    if (!req.ability?.can('create', 'Policy')) {
      throw new ForbiddenError('Insufficient permissions to create policy');
    }

    const policy = await prisma.policy.create({
      data: req.body,
      include: {
        _count: {
          select: {
            permissions: true,
            roles: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Policy created successfully',
      data: policy,
    });
  }
);

/**
 * Update policy
 * PUT /admin/policies/:id
 */
export const update = asyncHandler(
  async (req: Request<{ id: string }, {}, UpdatePolicyInput>, res: Response) => {
    if (!req.ability?.can('update', 'Policy')) {
      throw new ForbiddenError('Insufficient permissions to update policy');
    }

    const policy = await prisma.policy.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        _count: {
          select: {
            permissions: true,
            roles: true,
          },
        },
      },
    });

    // Clear cache for all roles using this policy
    for (const rolePolicy of policy.roles) {
      clearPermissionCache(rolePolicy.role.name);
    }

    res.json({
      message: 'Policy updated successfully',
      data: policy,
    });
  }
);

/**
 * Delete policy
 * DELETE /admin/policies/:id
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('delete', 'Policy')) {
    throw new ForbiddenError('Insufficient permissions to delete policy');
  }

  // Get policy with roles before deletion to clear cache
  const policy = await prisma.policy.findUnique({
    where: { id: req.params.id },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!policy) {
    throw new NotFoundError('Policy not found');
  }

  await prisma.policy.delete({
    where: { id: req.params.id },
  });

  // Clear cache for all roles using this policy
  for (const rolePolicy of policy.roles) {
    clearPermissionCache(rolePolicy.role.name);
  }

  res.json({
    message: 'Policy deleted successfully',
    data: policy,
  });
});
