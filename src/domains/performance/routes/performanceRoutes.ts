import { Router } from 'express';
import { performanceController } from '../controllers/PerformanceController';
import { authenticate } from '@/shared/middleware/auth';
import { checkPermission } from '@/shared/middleware/rbac';

const router = Router();

router.use(authenticate);

router.post(
  '/goals',
  checkPermission('performance', 'create'),
  performanceController.createGoal.bind(performanceController)
);
/**
 * @openapi
 * /performance/goals:
 *   post:
 *     summary: Create a performance goal
 *     tags: [performance]
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
 *         description: Performance goal created
 */

router.patch(
  '/goals/:goalId/progress',
  checkPermission('performance', 'update'),
  performanceController.updateGoalProgress.bind(performanceController)
);
/**
 * @openapi
 * /performance/goals/{goalId}/progress:
 *   patch:
 *     summary: Update goal progress
 *     tags: [performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: goalId
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
 *         description: Goal progress updated
 */

router.get(
  '/goals/:goalId',
  checkPermission('performance', 'read'),
  performanceController.getGoal.bind(performanceController)
);
/**
 * @openapi
 * /performance/goals/{goalId}:
 *   get:
 *     summary: Get performance goal details
 *     tags: [performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: goalId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance goal details
 */

router.post(
  '/reviews',
  checkPermission('performance', 'create'),
  performanceController.createReview.bind(performanceController)
);
/**
 * @openapi
 * /performance/reviews:
 *   post:
 *     summary: Create a performance review
 *     tags: [performance]
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
 *         description: Performance review created
 */

router.patch(
  '/reviews/:reviewId/complete',
  checkPermission('performance', 'update'),
  performanceController.finalizeReview.bind(performanceController)
);
/**
 * @openapi
 * /performance/reviews/{reviewId}/complete:
 *   patch:
 *     summary: Complete a performance review
 *     tags: [performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: reviewId
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
 *         description: Review completed
 */

router.get(
  '/reviews/:reviewId',
  checkPermission('performance', 'read'),
  performanceController.getReview.bind(performanceController)
);
/**
 * @openapi
 * /performance/reviews/{reviewId}:
 *   get:
 *     summary: Get performance review details
 *     tags: [performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: reviewId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance review details
 */

export { router as performanceRoutes };
