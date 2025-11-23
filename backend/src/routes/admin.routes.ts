import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import * as rolesController from '../controllers/admin/roles.controller';
import * as policiesController from '../controllers/admin/policies.controller';
import * as permissionsController from '../controllers/admin/permissions.controller';
import * as usersController from '../controllers/admin/users.controller';
import * as auditController from '../controllers/admin/audit.controller';
import { validate } from '../middleware/validator';
import { auditLog, captureBeforeState } from '../middleware/auditLog';
import * as schemas from '../validators/admin.schema';

const router = Router();

// All admin routes require authentication
router.use(requireAuth);

// Apply audit logging to all admin routes
router.use(auditLog);
router.use(captureBeforeState);

// ============================================
// ROLES
// ============================================

router.get('/roles', validate(schemas.paginationSchema), rolesController.list);
router.post('/roles', validate(schemas.createRoleSchema), rolesController.create);
router.get('/roles/:id', rolesController.getOne);
router.put('/roles/:id', validate(schemas.updateRoleSchema), rolesController.update);
router.delete('/roles/:id', rolesController.remove);

// Role-Policy associations
router.post('/roles/:id/policies', validate(schemas.assignPolicyToRoleSchema), rolesController.assignPolicy);
router.delete('/roles/:id/policies/:policyId', rolesController.removePolicy);

// ============================================
// POLICIES
// ============================================

router.get('/policies', validate(schemas.paginationSchema), policiesController.list);
router.post('/policies', validate(schemas.createPolicySchema), policiesController.create);
router.get('/policies/:id', policiesController.getOne);
router.put('/policies/:id', validate(schemas.updatePolicySchema), policiesController.update);
router.delete('/policies/:id', policiesController.remove);

// ============================================
// PERMISSIONS
// ============================================

router.get('/permissions', permissionsController.list);
router.post('/permissions', validate(schemas.createPermissionSchema), permissionsController.create);
router.put('/permissions/:id', validate(schemas.updatePermissionSchema), permissionsController.update);
router.delete('/permissions/:id', permissionsController.remove);

// ============================================
// USERS
// ============================================

router.get('/users', validate(schemas.paginationSchema), usersController.list);
router.post('/users', validate(schemas.createUserSchema), usersController.create);
router.get('/users/:id', usersController.getOne);
router.put('/users/:id', validate(schemas.updateUserSchema), usersController.update);
router.delete('/users/:id', usersController.remove);

// User-Role associations
router.post('/users/:id/roles', validate(schemas.assignRoleSchema), usersController.assignRole);
router.delete('/users/:id/roles/:roleId', usersController.removeRole);

// ============================================
// AUDIT LOGS
// ============================================

router.get('/audit-logs', auditController.list);
router.get('/audit-logs/:id', auditController.getOne);

// ============================================
// UTILITY ENDPOINTS
// ============================================

router.get('/permission-matrix', permissionsController.getMatrix);
router.post('/permission-test', permissionsController.testPermission);

export default router;
