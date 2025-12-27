import { Router } from 'express';
import { payrollController } from '../controllers/PayrollController';
import { authenticate } from '@/shared/middleware/auth';
import { checkPermission } from '@/shared/middleware/rbac';

const router = Router();

router.use(authenticate);

router.post(
  '/structures',
  checkPermission('payroll-structure', 'create'),
  payrollController.createStructure.bind(payrollController)
);

router.get(
  '/structures/active',
  checkPermission('payroll-structure', 'read'),
  payrollController.getActiveStructure.bind(payrollController)
);

router.post(
  '/runs',
  checkPermission('payroll', 'create'),
  payrollController.startRun.bind(payrollController)
);

router.get(
  '/runs/:runId',
  checkPermission('payroll', 'read'),
  payrollController.getRun.bind(payrollController)
);

router.get(
  '/runs/:runId/payslips',
  checkPermission('payroll', 'read'),
  payrollController.listPayslips.bind(payrollController)
);

router.get(
  '/payslips/:payslipId',
  checkPermission('payroll', 'read'),
  payrollController.getPayslip.bind(payrollController)
);

export { router as payrollRoutes };
