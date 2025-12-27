import { Router } from 'express';
import { notificationController } from '../controllers/NotificationController';
import { authenticate } from '@/shared/middleware/auth';
import { checkPermission } from '@/shared/middleware/rbac';

const router = Router();

router.use(authenticate);

router.post('/templates', checkPermission('notifications', 'create'), notificationController.createTemplate.bind(notificationController));
router.post('/send', checkPermission('notifications', 'create'), notificationController.sendNotification.bind(notificationController));
router.patch('/preferences', checkPermission('notifications', 'preferences'), notificationController.updatePreferences.bind(notificationController));
router.get('/logs', checkPermission('notifications', 'read'), notificationController.listLogs.bind(notificationController));

export { router as notificationRoutes };
