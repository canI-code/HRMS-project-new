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
  '/my-payslips',
  authenticate,
  payrollController.listMyPayslips.bind(payrollController)
);
/**
 * @openapi
 * /payroll/my-payslips:
 *   get:
 *     summary: Get current employee's payslips
 *     tags: [payroll]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of employee's payslips
 */

router.get(
  '/my-payslips/:payslipId',
  authenticate,
  payrollController.getMyPayslip.bind(payrollController)
);
/**
 * @openapi
 * /payroll/my-payslips/{payslipId}:
 *   get:
 *     summary: Get specific payslip for current employee (self-service)
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

router.post(
  '/employees/assign-salary',
  checkPermission('payroll-structure', 'create'),
  payrollController.assignSalary.bind(payrollController)
);
/**
 * @openapi
 * /payroll/employees/assign-salary:
 *   post:
 *     summary: Assign salary structure to employee
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
 *               employeeId:
 *                 type: string
 *               salaryStructureId:
 *                 type: string
 *               baseSalary:
 *                 type: number
 *     responses:
 *       201:
 *         description: Salary assigned
 */

router.get(
  '/employees/with-salary',
  checkPermission('payroll', 'read'),
  payrollController.listEmployeesWithSalary.bind(payrollController)
);
/**
 * @openapi
 * /payroll/employees/with-salary:
 *   get:
 *     summary: List all employees with their salary information
 *     tags: [payroll]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employees with salary
 */

router.get(
  '/employees/:employeeId/salary',
  checkPermission('payroll', 'read'),
  payrollController.getEmployeeSalary.bind(payrollController)
);
/**
 * @openapi
 * /payroll/employees/{employeeId}/salary:
 *   get:
 *     summary: Get employee's active salary
 *     tags: [payroll]
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
 *         description: Employee salary details
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
