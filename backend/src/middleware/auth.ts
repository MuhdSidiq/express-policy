import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import prisma from '../config/database';

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    throw new UnauthorizedError('Authentication required');
  }
  next();
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.ability?.can('manage', 'all')) {
    throw new ForbiddenError('Admin access required');
  }
  next();
}

/**
 * Middleware to attach user to request (optional - doesn't throw if not authenticated)
 */
export async function attachUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.session?.userId) {
      const user = await prisma.user.findUnique({
        where: { id: req.session.userId, isActive: true },
        include: {
          roles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (user) {
        req.user = user;
      } else {
        // User not found or inactive, clear session
        req.session.userId = undefined;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}
