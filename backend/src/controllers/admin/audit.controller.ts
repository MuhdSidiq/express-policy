import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { auditService } from '../../middleware/auditLog';

/**
 * List audit logs
 * GET /admin/audit-logs
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('read', 'AuditLog')) {
    throw new ForbiddenError('Insufficient permissions to view audit logs');
  }

  const {
    page,
    limit,
    userId,
    entity,
    action,
    startDate,
    endDate,
  } = req.query;

  const result = await auditService.getLogs({
    userId: userId as string,
    entity: entity as string,
    action: action as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });

  res.json(result);
});

/**
 * Get single audit log
 * GET /admin/audit-logs/:id
 */
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('read', 'AuditLog')) {
    throw new ForbiddenError('Insufficient permissions to view audit log');
  }

  const log = await auditService.getOne(req.params.id);

  if (!log) {
    throw new NotFoundError('Audit log not found');
  }

  res.json({ data: log });
});
