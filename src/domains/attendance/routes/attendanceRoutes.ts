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
  checkPermission('attendance', 'create'),
  attendanceController.checkIn.bind(attendanceController)
);

// Check out
router.post(
  '/check-out',
  checkPermission('attendance', 'update'),
  attendanceController.checkOut.bind(attendanceController)
);

// Mark absent
router.post(
  '/mark-absent',
  checkPermission('attendance', 'create'),
  attendanceController.markAbsent.bind(attendanceController)
);

// Get attendance by date
router.get(
  '/:employeeId/date',
  checkPermission('attendance', 'read'),
  attendanceController.getByDate.bind(attendanceController)
);

// Get monthly attendance
router.get(
  '/:employeeId/monthly',
  checkPermission('attendance', 'read'),
  attendanceController.getMonthly.bind(attendanceController)
);

// Create/update attendance policy
router.post(
  '/policy',
  checkPermission('attendance-policy', 'create'),
  attendanceController.upsertPolicy.bind(attendanceController)
);

export { router as attendanceRoutes };
