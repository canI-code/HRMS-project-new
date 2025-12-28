import { Router } from 'express';
import { attendanceController } from '../controllers/AttendanceController';
import { authenticate } from '../../../shared/middleware/auth';
import { checkPermission } from '../../../shared/middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Check in
router.post(
  '/check-in',
  checkPermission('attendance', 'create', {
    getUserId: (req) => req.user?.userId,
  }),
  attendanceController.checkIn.bind(attendanceController)
);
/**
 * @openapi
 * /attendance/check-in:
 *   post:
 *     summary: Check in for the day
 *     tags: [attendance]
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
 *         description: Check-in recorded
 */

// Check out
router.post(
  '/check-out',
  checkPermission('attendance', 'update', {
    getUserId: (req) => req.user?.userId,
  }),
  attendanceController.checkOut.bind(attendanceController)
);
/**
 * @openapi
 * /attendance/check-out:
 *   post:
 *     summary: Check out for the day
 *     tags: [attendance]
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
 *         description: Check-out recorded
 */

// Mark absent
router.post(
  '/mark-absent',
  checkPermission('attendance', 'create', {
    getUserId: (req) => req.user?.userId,
  }),
  attendanceController.markAbsent.bind(attendanceController)
);

// Get attendance by date
router.get(
  '/:employeeId/date',
  checkPermission('attendance', 'read'),
  attendanceController.getByDate.bind(attendanceController)
);
/**
 * @openapi
 * /attendance/{employeeId}/date:
 *   get:
 *     summary: Get attendance for a specific date
 *     tags: [attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: employeeId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance record
 */

// Get monthly attendance
router.get(
  '/:employeeId/monthly',
  checkPermission('attendance', 'read', {
    getUserId: (req) => req.user?.userId,
  }),
  attendanceController.getMonthly.bind(attendanceController)
);
/**
 * @openapi
 * /attendance/{employeeId}/monthly:
 *   get:
 *     summary: Get monthly attendance summary
 *     tags: [attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: employeeId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monthly attendance summary
 */

// Create/update attendance policy
router.post(
  '/policy',
  checkPermission('attendance-policy', 'create'),
  attendanceController.upsertPolicy.bind(attendanceController)
);

export { router as attendanceRoutes };
