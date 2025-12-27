import { Router } from 'express';
import { EmployeeController } from '@/domains/employees/controllers/EmployeeController';
import { authenticate } from '@/shared/middleware/auth';
import { checkPermission } from '@/shared/middleware/rbac';

const router = Router();

router.use(authenticate);

router.post('/', checkPermission('employees', 'create'), EmployeeController.create);
router.get('/', checkPermission('employees', 'read'), EmployeeController.list);
router.get('/:id', checkPermission('employees', 'read'), EmployeeController.get);
router.put('/:id', checkPermission('employees', 'update'), EmployeeController.update);
router.delete('/:id', checkPermission('employees', 'delete'), EmployeeController.remove);

router.post('/:id/manager', checkPermission('employees', 'update'), EmployeeController.setManager);
router.post('/:id/terminate', checkPermission('employees', 'delete'), EmployeeController.terminate);
router.post('/:id/onboarding/start', checkPermission('employees', 'update'), EmployeeController.startOnboarding);
router.post('/:id/onboarding/complete', checkPermission('employees', 'update'), EmployeeController.completeOnboarding);

export default router;
