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

router.patch(
  '/goals/:goalId/progress',
  checkPermission('performance', 'update'),
  performanceController.updateGoalProgress.bind(performanceController)
);

router.get(
  '/goals/:goalId',
  checkPermission('performance', 'read'),
  performanceController.getGoal.bind(performanceController)
);

router.post(
  '/reviews',
  checkPermission('performance', 'create'),
  performanceController.createReview.bind(performanceController)
);

router.patch(
  '/reviews/:reviewId/complete',
  checkPermission('performance', 'update'),
  performanceController.finalizeReview.bind(performanceController)
);

router.get(
  '/reviews/:reviewId',
  checkPermission('performance', 'read'),
  performanceController.getReview.bind(performanceController)
);

export { router as performanceRoutes };
