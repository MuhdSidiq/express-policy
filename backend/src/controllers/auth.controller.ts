import { Request, Response } from 'express';
import prisma from '../config/database';
import { PasswordService } from '../services/passwordService';
import { UnauthorizedError, BadRequestError, ConflictError } from '../utils/errors';
import { asyncHandler } from '../middleware/errorHandler';
import { LoginInput, RegisterInput } from '../validators/auth.schema';

/**
 * Login user
 * POST /auth/login
 */
export const login = asyncHandler(async (req: Request<{}, {}, LoginInput>, res: Response) => {
  const { email, password } = req.body;

  // Find user with roles
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
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
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is inactive');
  }

  // Verify password
  const isValidPassword = await PasswordService.verify(password, user.password);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Create session
  req.session.userId = user.id;

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    message: 'Login successful',
    user: userWithoutPassword,
  });
});

/**
 * Logout user
 * POST /auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });
  }

  res.json({
    message: 'Logout successful',
  });
});

/**
 * Get current user
 * GET /auth/me
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    throw new UnauthorizedError('Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: {
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
  });

  if (!user || !user.isActive) {
    // Clear invalid session
    req.session.userId = undefined;
    throw new UnauthorizedError('User not found or inactive');
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    user: userWithoutPassword,
  });
});

/**
 * Register new user (for testing/demo purposes)
 * POST /auth/register
 */
export const register = asyncHandler(
  async (req: Request<{}, {}, RegisterInput>, res: Response) => {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('User already exists');
    }

    // Validate password strength
    const passwordValidation = PasswordService.validateStrength(password);
    if (!passwordValidation.isValid) {
      throw new BadRequestError(passwordValidation.errors.join(', '));
    }

    // Hash password
    const hashedPassword = await PasswordService.hash(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isActive: true,
      },
      include: {
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
    });

    // Create session
    req.session.userId = user.id;

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'Registration successful',
      user: userWithoutPassword,
    });
  }
);

/**
 * Change password
 * POST /auth/change-password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    throw new UnauthorizedError('Not authenticated');
  }

  const { currentPassword, newPassword } = req.body;

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  // Verify current password
  const isValidPassword = await PasswordService.verify(currentPassword, user.password);
  if (!isValidPassword) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Validate new password strength
  const passwordValidation = PasswordService.validateStrength(newPassword);
  if (!passwordValidation.isValid) {
    throw new BadRequestError(passwordValidation.errors.join(', '));
  }

  // Hash and update password
  const hashedPassword = await PasswordService.hash(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  res.json({
    message: 'Password changed successfully',
  });
});
