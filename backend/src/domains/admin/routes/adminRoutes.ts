import { Router } from 'express';
import { authenticate } from '@/shared/middleware/auth';
import { checkPermission } from '@/shared/middleware/rbac';
import { adminController } from '../controllers/AdminController';
import { ConfigItemController } from '../controllers/ConfigItemController';

const router = Router();

router.use(authenticate);

router.get('/roles', checkPermission('admin', 'read'), adminController.listRoles.bind(adminController));
router.get('/audit-logs', checkPermission('admin', 'read'), adminController.listAuditLogs.bind(adminController));
router.get('/audit-logs/stats', checkPermission('admin', 'read'), adminController.auditStats.bind(adminController));
router.get('/users', checkPermission('admin', 'read'), adminController.listUsers.bind(adminController));
router.patch('/users/:id', checkPermission('admin', 'update'), adminController.updateUser.bind(adminController));

// Config Items (Departments, Titles, Locations) - Admin only
router.post('/config/seed', checkPermission('admin', 'create'), ConfigItemController.seed);
router.get('/config/:type', checkPermission('admin', 'read'), ConfigItemController.list);
router.post('/config/:type', checkPermission('admin', 'create'), ConfigItemController.create);
router.patch('/config/:type/:id', checkPermission('admin', 'update'), ConfigItemController.update);
router.delete('/config/:type/:id', checkPermission('admin', 'delete'), ConfigItemController.delete);

export { router as adminRoutes };

