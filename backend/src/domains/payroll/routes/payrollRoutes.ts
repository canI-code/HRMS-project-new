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
/**
 * @openapi
 * /payroll/structures:
 *   post:
 *     summary: Create payroll structure
 *     tags: [payroll]
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
 *         description: Payroll structure created
 */

router.get(
  '/structures/active',
  checkPermission('payroll-structure', 'read'),
  payrollController.getActiveStructure.bind(payrollController)
);
/**
 * @openapi
 * /payroll/structures/active:
 *   get:
 *     summary: Get active payroll structure
 *     tags: [payroll]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active payroll structure
 */

router.post(
  '/runs',
  checkPermission('payroll', 'create'),
  payrollController.startRun.bind(payrollController)
);
/**
 * @openapi
 * /payroll/runs:
 *   post:
 *     summary: Start a payroll run
 *     tags: [payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               periodStart:
 *                 type: string
 *                 format: date
 *               periodEnd:
 *                 type: string
 *                 format: date
 *               employees:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       202:
 *         description: Payroll run started
 */

router.get(
  '/runs/:runId',
  checkPermission('payroll', 'read'),
  payrollController.getRun.bind(payrollController)
);
/**
 * @openapi
 * /payroll/runs/{runId}:
 *   get:
 *     summary: Get payroll run details
 *     tags: [payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: runId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payroll run details
 */

router.get(
  '/runs/:runId/payslips',
  checkPermission('payroll', 'read'),
  payrollController.listPayslips.bind(payrollController)
);
/**
 * @openapi
 * /payroll/runs/{runId}/payslips:
 *   get:
 *     summary: List payslips for a run
 *     tags: [payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: runId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payslip list
 */

router.get(
  '/payslips/:payslipId',
  checkPermission('payroll', 'read'),
  payrollController.getPayslip.bind(payrollController)
);
/**
 * @openapi
 * /payroll/payslips/{payslipId}:
 *   get:
 *     summary: Get payslip by ID
 *     tags: [payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: payslipId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payslip details
 */

export { router as payrollRoutes };
