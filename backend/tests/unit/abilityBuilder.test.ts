import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AbilityBuilderService } from '../../src/services/abilityBuilder';
import prisma from '../../src/config/database';

describe('AbilityBuilderService', () => {
  const abilityBuilder = new AbilityBuilderService(prisma);
  let testData: {
    adminRole: any;
    financeRole: any;
    fullAccessPolicy: any;
    viewOrdersPolicy: any;
  };

  beforeAll(async () => {
    // Create test roles and policies
    const adminRole = await prisma.role.create({
      data: {
        name: 'test_admin',
        description: 'Test admin role',
      },
    });

    const financeRole = await prisma.role.create({
      data: {
        name: 'test_finance',
        description: 'Test finance role',
      },
    });

    const fullAccessPolicy = await prisma.policy.create({
      data: {
        name: 'TestFullAccess',
        description: 'Full access for testing',
        permissions: {
          create: [
            {
              action: 'manage',
              subject: 'all',
              fields: [],
              conditions: null,
              inverted: false,
            },
          ],
        },
      },
    });

    const viewOrdersPolicy = await prisma.policy.create({
      data: {
        name: 'TestViewOrders',
        description: 'View orders for testing',
        permissions: {
          create: [
            {
              action: 'read',
              subject: 'Order',
              fields: [],
              conditions: null,
              inverted: false,
            },
          ],
        },
      },
    });

    // Assign policies to roles
    await prisma.rolePolicy.createMany({
      data: [
        { roleId: adminRole.id, policyId: fullAccessPolicy.id },
        { roleId: financeRole.id, policyId: viewOrdersPolicy.id },
      ],
    });

    testData = {
      adminRole,
      financeRole,
      fullAccessPolicy,
      viewOrdersPolicy,
    };
  });

  afterAll(async () => {
    // Cleanup
    await prisma.rolePolicy.deleteMany({
      where: {
        roleId: {
          in: [testData.adminRole.id, testData.financeRole.id],
        },
      },
    });
    await prisma.permission.deleteMany({
      where: {
        policyId: {
          in: [testData.fullAccessPolicy.id, testData.viewOrdersPolicy.id],
        },
      },
    });
    await prisma.policy.deleteMany({
      where: {
        name: {
          in: ['TestFullAccess', 'TestViewOrders'],
        },
      },
    });
    await prisma.role.deleteMany({
      where: {
        name: {
          in: ['test_admin', 'test_finance'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('defineAbilityFor', () => {
    it('should return empty ability for null user', async () => {
      const ability = await abilityBuilder.defineAbilityFor(null);
      expect(ability.can('read', 'Order')).toBe(false);
      expect(ability.can('manage', 'all')).toBe(false);
    });

    it('should return empty ability for user with no roles', async () => {
      const user = {
        id: 'test123',
        email: 'test@example.com',
        roles: [],
      };
      const ability = await abilityBuilder.defineAbilityFor(user);
      expect(ability.can('read', 'Order')).toBe(false);
    });

    it('should grant full access to admin', async () => {
      const user = {
        id: 'admin123',
        email: 'admin@example.com',
        roles: [{ role: { name: 'test_admin' } }],
      };
      const ability = await abilityBuilder.defineAbilityFor(user);
      expect(ability.can('manage', 'all')).toBe(true);
      expect(ability.can('read', 'Order')).toBe(true);
      expect(ability.can('create', 'Order')).toBe(true);
      expect(ability.can('delete', 'Product')).toBe(true);
    });

    it('should grant limited access to finance', async () => {
      const user = {
        id: 'finance123',
        email: 'finance@example.com',
        roles: [{ role: { name: 'test_finance' } }],
      };
      const ability = await abilityBuilder.defineAbilityFor(user);
      expect(ability.can('read', 'Order')).toBe(true);
      expect(ability.can('create', 'Order')).toBe(false);
      expect(ability.can('delete', 'Order')).toBe(false);
      expect(ability.can('manage', 'all')).toBe(false);
    });
  });

  describe('cache', () => {
    it('should cache permissions for roles', async () => {
      const user = {
        id: 'test123',
        email: 'test@example.com',
        roles: [{ role: { name: 'test_admin' } }],
      };

      // First call - should hit database
      await abilityBuilder.defineAbilityFor(user);

      // Second call - should use cache
      const stats = abilityBuilder.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should clear cache', () => {
      abilityBuilder.clearCache();
      const stats = abilityBuilder.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should clear cache for specific role', async () => {
      const user1 = {
        id: 'test1',
        email: 'test1@example.com',
        roles: [{ role: { name: 'test_admin' } }],
      };
      const user2 = {
        id: 'test2',
        email: 'test2@example.com',
        roles: [{ role: { name: 'test_finance' } }],
      };

      await abilityBuilder.defineAbilityFor(user1);
      await abilityBuilder.defineAbilityFor(user2);

      const statsBefore = abilityBuilder.getCacheStats();
      const initialSize = statsBefore.size;

      abilityBuilder.clearCache('test_admin');

      const statsAfter = abilityBuilder.getCacheStats();
      expect(statsAfter.size).toBeLessThan(initialSize);
    });
  });
});
