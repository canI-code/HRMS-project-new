import { Router } from 'express';
import { LeaveController } from '@/domains/leave/controllers/LeaveController';
import { LeavePolicyController } from '@/domains/leave/controllers/LeavePolicyController';
import { authenticate } from '@/shared/middleware/auth';
import { checkPermission } from '@/shared/middleware/rbac';

const router = Router();

router.use(authenticate);

// Policy Management
router.get(
	'/policy',
	checkPermission('leaves', 'read'),
	LeavePolicyController.get
);

router.post(
	'/policy',
	// Usually only HR admin/Super admin. 'leaves:update' might be too broad if it allows managers.
	// We rely on Controller check for roles hr_admin/super_admin or RBAC config.
	// Assuming RBAC 'update' is enough, but controller has extra check.
	checkPermission('leaves', 'update'),
	LeavePolicyController.update
);

router.get(
	'/balance',
	checkPermission('leaves', 'read', {
		getUserId: (req) => req.user?.userId,
	}),
	LeaveController.getBalances
);

// Request a leave
router.post(
	'/',
	checkPermission('leaves', 'create', {
		getUserId: (req) => req.user?.userId,
	}),
	LeaveController.request
);
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
router.get(
	'/',
	checkPermission('leaves', 'read', {
		getUserId: (req) => req.user?.userId,
	}),
	LeaveController.list
);
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
 *       403:
 *         description: Insufficient permissions
 */

router.get(
	'/:id',
	checkPermission('leaves', 'read', {
		getUserId: (req) => req.user?.userId,
	}),
	LeaveController.get
);
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
 *       404:
 *         description: Leave request not found
 */

// Workflow actions
router.post(
	'/:id/approve',
	checkPermission('leaves', 'update', {
		getUserId: (req) => req.user?.userId,
	}),
	LeaveController.approve
);
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
router.post(
	'/:id/reject',
	checkPermission('leaves', 'update', {
		getUserId: (req) => req.user?.userId,
	}),
	LeaveController.reject
);
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
router.post(
	'/:id/cancel',
	checkPermission('leaves', 'update', {
		getUserId: (req) => req.user?.userId,
	}),
	LeaveController.cancel
);
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
