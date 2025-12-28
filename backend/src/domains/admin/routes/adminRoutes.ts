import { Router } from 'express';
import { authenticate } from '@/shared/middleware/auth';
import { checkPermission } from '@/shared/middleware/rbac';
import { adminController } from '../controllers/AdminController';

const router = Router();

router.use(authenticate);

router.get('/roles', checkPermission('admin', 'read'), adminController.listRoles.bind(adminController));
router.get('/audit-logs', checkPermission('admin', 'read'), adminController.listAuditLogs.bind(adminController));
router.get('/audit-logs/stats', checkPermission('admin', 'read'), adminController.auditStats.bind(adminController));
router.get('/users', checkPermission('admin', 'read'), adminController.listUsers.bind(adminController));
router.patch('/users/:id', checkPermission('admin', 'update'), adminController.updateUser.bind(adminController));

export { router as adminRoutes };
