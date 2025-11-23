import { PrismaClient } from '@prisma/client';

interface AuditLogData {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  changes?: {
    before?: any;
    after?: any;
  };
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create an audit log entry
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          changes: data.changes,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      // Log to external service in production (DataDog, Sentry, etc.)
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getLogs(filters: {
    userId?: string;
    entity?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50, ...where } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (where.userId) whereClause.userId = where.userId;
    if (where.entity) whereClause.entity = where.entity;
    if (where.action) whereClause.action = where.action;

    if (where.startDate && where.endDate) {
      whereClause.createdAt = {
        gte: where.startDate,
        lte: where.endDate,
      };
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: whereClause }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single audit log by ID
   */
  async getOne(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
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
    });
  }

  /**
   * Get audit logs for a specific entity
   */
  async getLogsForEntity(entity: string, entityId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get recent activity for a user
   */
  async getUserActivity(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }
}
