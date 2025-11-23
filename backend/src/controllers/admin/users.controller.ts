import { Request, Response } from 'express';
import prisma from '../../config/database';
import { asyncHandler } from '../../middleware/errorHandler';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { CreateUserInput, UpdateUserInput } from '../../validators/admin.schema';
import { PasswordService } from '../../services/passwordService';

/**
 * List all users
 * GET /admin/users
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('read', 'User')) {
    throw new ForbiddenError('Insufficient permissions to view users');
  }

  const { page = 1, limit = 50, search, roleId } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: String(search), mode: 'insensitive' } },
      { firstName: { contains: String(search), mode: 'insensitive' } },
      { lastName: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  if (roleId) {
    where.roles = {
      some: {
        roleId: String(roleId),
      },
    };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: Number(limit),
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    data: users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Get single user by ID
 * GET /admin/users/:id
 */
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('read', 'User')) {
    throw new ForbiddenError('Insufficient permissions to view user');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
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

  res.json({ data: user });
});

/**
 * Create new user
 * POST /admin/users
 */
export const create = asyncHandler(
  async (req: Request<{}, {}, CreateUserInput>, res: Response) => {
    if (!req.ability?.can('create', 'User')) {
      throw new ForbiddenError('Insufficient permissions to create user');
    }

    const { password, ...userData } = req.body;

    // Hash password
    const hashedPassword = await PasswordService.hash(password);

    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({
      message: 'User created successfully',
      data: user,
    });
  }
);

/**
 * Update user
 * PUT /admin/users/:id
 */
export const update = asyncHandler(
  async (req: Request<{ id: string }, {}, UpdateUserInput>, res: Response) => {
    if (!req.ability?.can('update', 'User')) {
      throw new ForbiddenError('Insufficient permissions to update user');
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: req.body,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    res.json({
      message: 'User updated successfully',
      data: user,
    });
  }
);

/**
 * Delete user (soft delete by setting isActive = false)
 * DELETE /admin/users/:id
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('delete', 'User')) {
    throw new ForbiddenError('Insufficient permissions to delete user');
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  });

  res.json({
    message: 'User deactivated successfully',
    data: user,
  });
});

/**
 * Assign role to user
 * POST /admin/users/:id/roles
 */
export const assignRole = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('update', 'User')) {
    throw new ForbiddenError('Insufficient permissions to assign role');
  }

  const { id } = req.params;
  const { roleId } = req.body;

  // Check if user and role exist
  const [user, role] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.role.findUnique({ where: { id: roleId } }),
  ]);

  if (!user) throw new NotFoundError('User not found');
  if (!role) throw new NotFoundError('Role not found');

  // Create association
  await prisma.userRole.create({
    data: {
      userId: id,
      roleId,
      assignedBy: req.session?.userId,
    },
  });

  res.json({
    message: 'Role assigned to user successfully',
  });
});

/**
 * Remove role from user
 * DELETE /admin/users/:id/roles/:roleId
 */
export const removeRole = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('update', 'User')) {
    throw new ForbiddenError('Insufficient permissions to remove role');
  }

  const { id, roleId } = req.params;

  await prisma.userRole.delete({
    where: {
      userId_roleId: {
        userId: id,
        roleId,
      },
    },
  });

  res.json({
    message: 'Role removed from user successfully',
  });
});
