import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { PrismaClient } from '@prisma/client';

interface User {
  id: string;
  email: string;
  roles: Array<{ role: { name: string } }>;
}

interface CachedPermissions {
  timestamp: number;
  permissions: any[];
}

// In-memory cache (will be replaced with Redis in production)
const permissionCache = new Map<string, CachedPermissions>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class AbilityBuilderService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Build CASL Ability for a user
   * @param user - User object with roles
   * @returns MongoAbility instance
   */
  async defineAbilityFor(user: User | null): Promise<MongoAbility> {
    if (!user || !user.roles || user.roles.length === 0) {
      // Anonymous user - no permissions
      return createMongoAbility([]);
    }

    const roleNames = user.roles.map(ur => ur.role.name);
    const allPermissions = await this.getPermissionsForRoles(roleNames);

    return this.buildAbilityFromPermissions(allPermissions, user);
  }

  /**
   * Get all permissions for given roles (with caching)
   */
  private async getPermissionsForRoles(roleNames: string[]) {
    const cacheKey = roleNames.sort().join(',');
    const cached = permissionCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.permissions;
    }

    // Fetch permissions from database
    const permissions = await this.prisma.permission.findMany({
      where: {
        policy: {
          isActive: true,
          roles: {
            some: {
              role: {
                name: { in: roleNames },
                isActive: true,
              },
            },
          },
        },
      },
      include: {
        policy: true,
      },
    });

    permissionCache.set(cacheKey, {
      timestamp: Date.now(),
      permissions,
    });

    return permissions;
  }

  /**
   * Build CASL ability from permission rules
   */
  private buildAbilityFromPermissions(permissions: any[], user: User) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    for (const permission of permissions) {
      const { action, subject, conditions, fields, inverted } = permission;

      // Replace template variables in conditions
      const processedConditions = this.replaceVariables(conditions, user);

      const permissionFields = fields && fields.length > 0 ? fields : undefined;

      if (inverted) {
        cannot(action, subject, permissionFields).because(permission.reason || undefined);
      } else {
        can(action, subject, processedConditions, permissionFields);
      }
    }

    return build();
  }

  /**
   * Replace template variables in conditions
   * Example: { userId: '{{currentUser.id}}' } => { userId: 'user123' }
   */
  private replaceVariables(conditions: any, user: User): any {
    if (!conditions || typeof conditions !== 'object') {
      return conditions;
    }

    const conditionsStr = JSON.stringify(conditions);
    const replaced = conditionsStr
      .replace(/\{\{\s*currentUser\.id\s*\}\}/g, user.id)
      .replace(/\{\{\s*currentUser\.email\s*\}\}/g, user.email);

    return JSON.parse(replaced);
  }

  /**
   * Clear permission cache (call after permission changes)
   */
  clearCache(roleName?: string) {
    if (roleName) {
      // Clear all cache entries containing this role
      for (const [key] of permissionCache) {
        if (key.split(',').includes(roleName)) {
          permissionCache.delete(key);
        }
      }
    } else {
      permissionCache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: permissionCache.size,
      entries: Array.from(permissionCache.keys()),
    };
  }
}
