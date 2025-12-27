import { Router } from 'express';
import { notificationController } from '../controllers/NotificationController';
import { authenticate } from '@/shared/middleware/auth';
import { checkPermission } from '@/shared/middleware/rbac';

const router = Router();

router.use(authenticate);

router.post('/templates', checkPermission('notifications', 'create'), notificationController.createTemplate.bind(notificationController));
/**
 * @openapi
 * /notifications/templates:
 *   post:
 *     summary: Create notification template
 *     tags: [notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Template created
 */
router.post('/send', checkPermission('notifications', 'create'), notificationController.sendNotification.bind(notificationController));
/**
 * @openapi
 * /notifications/send:
 *   post:
 *     summary: Send a notification
 *     tags: [notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       202:
 *         description: Notification queued for delivery
 */
router.patch('/preferences', checkPermission('notifications', 'preferences'), notificationController.updatePreferences.bind(notificationController));
/**
 * @openapi
 * /notifications/preferences:
 *   patch:
 *     summary: Update notification preferences
 *     tags: [notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.get('/logs', checkPermission('notifications', 'read'), notificationController.listLogs.bind(notificationController));
/**
 * @openapi
 * /notifications/logs:
 *   get:
 *     summary: List notification logs
 *     tags: [notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Log entries
 */

export { router as notificationRoutes };
