import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/auditService';
import prisma from '../config/database';

const auditService = new AuditService(prisma);

const AUDITABLE_PATHS = ['/admin/roles', '/admin/policies', '/admin/permissions', '/admin/users'];

const ACTION_MAP: Record<string, string> = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
};

/**
 * Middleware to audit admin actions
 */
export function auditLog(req: Request, res: Response, next: NextFunction) {
  // Only audit admin routes and mutating operations
  const isAuditablePath = AUDITABLE_PATHS.some(path => req.path.startsWith(path));
  const isAuditableMethod = !!ACTION_MAP[req.method];

  if (!isAuditablePath || !isAuditableMethod) {
    return next();
  }

  // Store original send function
  const originalSend = res.send;

  // Override send to capture response data
  res.send = function (data: any): Response {
    const action = `${ACTION_MAP[req.method]}_${extractEntityFromPath(req.path)}`;

    // Create audit log (non-blocking)
    auditService
      .log({
        userId: req.session?.userId,
        action,
        entity: extractEntityFromPath(req.path),
        entityId: req.params.id,
        changes: {
          before: res.locals.beforeData,
          after: typeof data === 'string' ? JSON.parse(data) : data,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      })
      .catch(err => console.error('Audit log failed:', err));

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Middleware to capture before state for updates/deletes
 */
export async function captureBeforeState(req: Request, res: Response, next: NextFunction) {
  const isUpdateOrDelete = ['PUT', 'PATCH', 'DELETE'].includes(req.method);

  if (!isUpdateOrDelete || !req.params.id) {
    return next();
  }

  try {
    const entity = extractEntityFromPath(req.path);
    const modelName = entity.toLowerCase();

    // Get current state from database
    // @ts-ignore - Dynamic model access
    const beforeData = await prisma[modelName]?.findUnique({
      where: { id: req.params.id },
    });

    res.locals.beforeData = beforeData;
  } catch (error) {
    console.error('Failed to capture before state:', error);
  }

  next();
}

/**
 * Extract entity name from request path
 */
function extractEntityFromPath(path: string): string {
  const match = path.match(/\/admin\/([^\/]+)/);
  if (!match) return 'UNKNOWN';

  const entity = match[1];
  // Singularize and capitalize
  return entity.endsWith('s')
    ? entity.slice(0, -1).toUpperCase()
    : entity.toUpperCase();
}

export { auditService };
