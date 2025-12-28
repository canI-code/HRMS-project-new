import { Router } from 'express';
import { EmployeeController } from '@/domains/employees/controllers/EmployeeController';
import { authenticate } from '@/shared/middleware/auth';
import { checkPermission } from '@/shared/middleware/rbac';

const router = Router();

router.use(authenticate);

router.post('/', checkPermission('employees', 'create'), EmployeeController.create);
/**
 * @openapi
 * /employees:
 *   post:
 *     summary: Create employee
 *     tags: [employees]
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
 *         description: Employee created
 */
router.get('/', checkPermission('employees', 'read'), EmployeeController.list);
/**
 * @openapi
 * /employees:
 *   get:
 *     summary: List employees
 *     tags: [employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee list
 */
// Current user's employee profile (no RBAC - restricted to own record)
// Place this before parameterized routes to avoid matching "/me" as ":id"
router.get('/me', EmployeeController.getMe);
router.get('/:id', checkPermission('employees', 'read'), EmployeeController.get);
/**
 * @openapi
 * /employees/{id}:
 *   get:
 *     summary: Get employee by id
 *     tags: [employees]
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
 *         description: Employee details
 */
router.put('/:id', checkPermission('employees', 'update'), EmployeeController.update);
/**
 * @openapi
 * /employees/{id}:
 *   put:
 *     summary: Update employee
 *     tags: [employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Employee updated
 */
router.delete('/:id', checkPermission('employees', 'delete'), EmployeeController.remove);
/**
 * @openapi
 * /employees/{id}:
 *   delete:
 *     summary: Delete employee
 *     tags: [employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Employee deleted
 */

router.post('/:id/manager', checkPermission('employees', 'update'), EmployeeController.setManager);
router.post('/:id/terminate', checkPermission('employees', 'delete'), EmployeeController.terminate);
router.post('/:id/onboarding/start', checkPermission('employees', 'update'), EmployeeController.startOnboarding);
router.post('/:id/onboarding/complete', checkPermission('employees', 'update'), EmployeeController.completeOnboarding);

export default router;
