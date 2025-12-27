import { Router } from 'express';
import { LeaveController } from '@/domains/leave/controllers/LeaveController';
import { authenticate } from '@/shared/middleware/auth';
import { checkPermission } from '@/shared/middleware/rbac';

const router = Router();

router.use(authenticate);

// Request a leave
router.post('/', checkPermission('leaves', 'create'), LeaveController.request);
/**
 * @openapi
 * /leaves:
 *   post:
 *     summary: Request a leave
 *     tags: [leaves]
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
 *         description: Leave request created
 */

// Query and get
router.get('/', checkPermission('leaves', 'read'), LeaveController.list);
/**
 * @openapi
 * /leaves:
 *   get:
 *     summary: List all leave requests
 *     tags: [leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of leave requests
 */
router.get('/:id', checkPermission('leaves', 'read'), LeaveController.get);
/**
 * @openapi
 * /leaves/{id}:
 *   get:
 *     summary: Get leave request by ID
 *     tags: [leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leave request details
 */

// Workflow actions
router.post('/:id/approve', checkPermission('leaves', 'update'), LeaveController.approve);
/**
 * @openapi
 * /leaves/{id}/approve:
 *   post:
 *     summary: Approve a leave request
 *     tags: [leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leave request approved
 */
router.post('/:id/reject', checkPermission('leaves', 'update'), LeaveController.reject);
/**
 * @openapi
 * /leaves/{id}/reject:
 *   post:
 *     summary: Reject a leave request
 *     tags: [leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leave request rejected
 */
router.post('/:id/cancel', checkPermission('leaves', 'update'), LeaveController.cancel);
/**
 * @openapi
 * /leaves/{id}/cancel:
 *   post:
 *     summary: Cancel a leave request
 *     tags: [leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leave request cancelled
 */

export default router;
