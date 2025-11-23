import { Request, Response, NextFunction } from 'express';
import { AbilityBuilderService } from '../services/abilityBuilder';
import prisma from '../config/database';

const abilityBuilder = new AbilityBuilderService(prisma);

/**
 * Middleware to attach CASL ability to request
 * This should be used after attachUser middleware
 */
export async function attachAbility(req: Request, res: Response, next: NextFunction) {
  try {
    // Get user from request (set by attachUser middleware)
    const user = req.user;

    // Build ability based on user's roles and policies
    req.ability = await abilityBuilder.defineAbilityFor(user);

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Clear permission cache (useful after permission updates)
 */
export function clearPermissionCache(roleName?: string) {
  abilityBuilder.clearCache(roleName);
}

/**
 * Get cache statistics
 */
export function getPermissionCacheStats() {
  return abilityBuilder.getCacheStats();
}
