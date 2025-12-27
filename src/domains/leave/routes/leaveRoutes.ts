import { Router } from 'express';
import { LeaveController } from '@/domains/leave/controllers/LeaveController';
import { authenticate } from '@/shared/middleware/auth';
import { checkPermission } from '@/shared/middleware/rbac';

const router = Router();

router.use(authenticate);

// Request a leave
router.post('/', checkPermission('leaves', 'create'), LeaveController.request);

// Query and get
router.get('/', checkPermission('leaves', 'read'), LeaveController.list);
router.get('/:id', checkPermission('leaves', 'read'), LeaveController.get);

// Workflow actions
router.post('/:id/approve', checkPermission('leaves', 'update'), LeaveController.approve);
router.post('/:id/reject', checkPermission('leaves', 'update'), LeaveController.reject);
router.post('/:id/cancel', checkPermission('leaves', 'update'), LeaveController.cancel);

export default router;
