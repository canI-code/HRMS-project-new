import { Request, Response, NextFunction } from 'express';
import { performanceService } from '../services/PerformanceService';
import { AppError } from '@/shared/utils/AppError';

export class PerformanceController {
  async createGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const { title, description, ownerId, startDate, dueDate, metrics } = req.body;
      if (!title || !ownerId) {
        throw new AppError('Title and ownerId are required', 400, 'VALIDATION_ERROR');
      }

      const goalPayload = {
        title,
        description,
        ownerId,
        dueDate: dueDate ? new Date(dueDate) : null,
        metrics,
      } as const;

      const goal = await performanceService.createGoal(
        context.organizationId.toString(),
        startDate
          ? { ...goalPayload, startDate: new Date(startDate) }
          : goalPayload,
        context.userId.toString(),
        context.requestId
      );

      res.status(201).json(goal);
    } catch (error) {
      next(error);
    }
  }

  async updateGoalProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const { goalId } = req.params;
      const { delta } = req.body;
      if (!goalId) {
        throw new AppError('Goal ID is required', 400, 'VALIDATION_ERROR');
      }
      if (delta === undefined || delta === null || Number.isNaN(Number(delta))) {
        throw new AppError('Delta progress is required', 400, 'VALIDATION_ERROR');
      }

      const goal = await performanceService.updateGoalProgress(
        context.organizationId.toString(),
        goalId,
        Number(delta),
        context.userId.toString(),
        context.requestId
      );

      res.json(goal);
    } catch (error) {
      next(error);
    }
  }

  async getGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }
      const { goalId } = req.params;
      if (!goalId) {
        throw new AppError('Goal ID is required', 400, 'VALIDATION_ERROR');
      }

      const goal = await performanceService.getGoal(goalId, context.organizationId.toString());
      if (!goal) {
        throw new AppError('Goal not found', 404, 'NOT_FOUND');
      }

      res.json(goal);
    } catch (error) {
      next(error);
    }
  }

  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const { revieweeId, reviewerId, cycle, periodStart, periodEnd, goalsSnapshot } = req.body;
      if (!revieweeId || !reviewerId || !cycle || !periodStart || !periodEnd) {
        throw new AppError('Invalid review payload', 400, 'VALIDATION_ERROR');
      }

      const review = await performanceService.createReview(
        context.organizationId.toString(),
        {
          revieweeId,
          reviewerId,
          cycle,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          goalsSnapshot,
        },
        context.userId.toString(),
        context.requestId
      );

      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  }

  async finalizeReview(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const { reviewId } = req.params;
      const { rating, strengths, improvements, summary } = req.body;
      if (!reviewId) {
        throw new AppError('Review ID is required', 400, 'VALIDATION_ERROR');
      }

      const review = await performanceService.finalizeReview(
        context.organizationId.toString(),
        reviewId,
        { rating, strengths, improvements, summary },
        context.userId.toString(),
        context.requestId
      );

      res.json(review);
    } catch (error) {
      next(error);
    }
  }

  async getReview(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }
      const { reviewId } = req.params;
      if (!reviewId) {
        throw new AppError('Review ID is required', 400, 'VALIDATION_ERROR');
      }

      const review = await performanceService.getReview(reviewId, context.organizationId.toString());
      if (!review) {
        throw new AppError('Review not found', 404, 'NOT_FOUND');
      }

      res.json(review);
    } catch (error) {
      next(error);
    }
  }
}

export const performanceController = new PerformanceController();
