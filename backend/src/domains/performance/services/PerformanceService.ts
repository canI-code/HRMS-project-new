import { Types } from 'mongoose';
import { PerformanceGoalModel, IPerformanceGoal, GoalStatus } from '../models/PerformanceGoal';
import { PerformanceReviewModel, IPerformanceReview } from '../models/PerformanceReview';
import { AppError } from '@/shared/utils/AppError';
import { auditLogStore } from '@/shared/middleware/auditLogger';
import { AuditAction } from '@/shared/types/common';

export interface ReviewCompletionInput {
  rating: number;
  strengths: string;
  improvements: string;
  summary?: string;
}

export interface GoalPayload {
  title: string;
  description?: string;
  ownerId: string;
  startDate?: Date;
  dueDate?: Date | null;
  metrics?: { name: string; target: number; current?: number; unit?: string }[];
}

export interface ReviewPayload {
  revieweeId: string;
  reviewerId: string;
  cycle: string;
  periodStart: Date;
  periodEnd: Date;
  goalsSnapshot?: { goalId: string; progress: number }[];
}

const clampProgress = (value: number): number => Math.min(100, Math.max(0, value));

export const computeNextProgress = (current: number, delta: number): { progress: number; status: GoalStatus } => {
  const next = clampProgress(current + delta);
  const status: GoalStatus = next === 0 ? 'draft' : next >= 100 ? 'completed' : 'in_progress';
  return { progress: next, status };
};

export const validateReviewCompletionData = (input: ReviewCompletionInput): void => {
  if (!input.rating || input.rating < 1 || input.rating > 5) {
    throw new AppError('Overall rating must be between 1 and 5', 400, 'VALIDATION_ERROR');
  }
  if (!input.strengths || !input.improvements) {
    throw new AppError('Strengths and improvements feedback are required', 400, 'VALIDATION_ERROR');
  }
};

class PerformanceService {
  async createGoal(
    organizationId: string,
    payload: GoalPayload,
    userId: string,
    requestId: string
  ): Promise<IPerformanceGoal> {
    if (!payload.title || !payload.ownerId) {
      throw new AppError('Title and owner are required', 400, 'VALIDATION_ERROR');
    }

    const goal = await PerformanceGoalModel.create({
      organizationId: new Types.ObjectId(organizationId),
      title: payload.title,
      description: payload.description || '',
      ownerId: new Types.ObjectId(payload.ownerId),
      status: 'draft',
      startDate: payload.startDate || new Date(),
      dueDate: payload.dueDate ?? null,
      progress: 0,
      metrics: (payload.metrics || []).map((m) => ({
        name: m.name,
        target: m.target,
        current: m.current ?? 0,
        unit: m.unit || '',
      })),
      createdBy: new Types.ObjectId(userId),
    });

    await auditLogStore.add({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(userId),
      action: AuditAction.CREATE,
      resource: 'performance-goal',
      resourceId: new Types.ObjectId(goal._id.toString()),
      success: true,
      metadata: {
        ipAddress: 'internal',
        userAgent: 'performance-service',
        requestId,
        timestamp: new Date(),
        method: 'POST',
        url: '/api/performance/goals',
      },
    });

    return goal;
  }

  async getGoal(goalId: string, organizationId: string): Promise<IPerformanceGoal | null> {
    return PerformanceGoalModel.findOne({ _id: goalId, organizationId });
  }

  async listMyGoals(organizationId: string, userId: string): Promise<IPerformanceGoal[]> {
    // Need to get the employee ID from the user ID
    const { EmployeeModel } = await import('@/domains/employees/models/Employee');
    const employee = await EmployeeModel.findOne({
      userId: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(organizationId),
    });

    if (!employee) {
      return []; // No employee profile, return empty
    }

    return PerformanceGoalModel.find({
      organizationId: new Types.ObjectId(organizationId),
      ownerId: employee._id,
    }).sort({ createdAt: -1 });
  }

  async listGoals(organizationId: string): Promise<IPerformanceGoal[]> {
    return PerformanceGoalModel.find({
      organizationId: new Types.ObjectId(organizationId),
    }).sort({ createdAt: -1 });
  }

  async updateGoalProgress(
    organizationId: string,
    goalId: string,
    delta: number,
    userId: string,
    requestId: string
  ): Promise<IPerformanceGoal> {
    const goal = await PerformanceGoalModel.findOne({ _id: goalId, organizationId });
    if (!goal) {
      throw new AppError('Goal not found', 404, 'NOT_FOUND');
    }

    const next = computeNextProgress(goal.progress ?? 0, delta);
    goal.progress = next.progress;
    goal.status = next.status;
    goal.updatedBy = new Types.ObjectId(userId);
    await goal.save();

    await auditLogStore.add({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(userId),
      action: AuditAction.UPDATE,
      resource: 'performance-goal',
      resourceId: new Types.ObjectId(goal._id.toString()),
      changes: { after: { progress: next.progress, status: next.status } },
      success: true,
      metadata: {
        ipAddress: 'internal',
        userAgent: 'performance-service',
        requestId,
        timestamp: new Date(),
        method: 'PATCH',
        url: '/api/performance/goals',
      },
    });

    return goal;
  }

  async createReview(
    organizationId: string,
    payload: ReviewPayload,
    userId: string,
    requestId: string
  ): Promise<IPerformanceReview> {
    if (!payload.revieweeId || !payload.reviewerId || !payload.cycle) {
      throw new AppError('Reviewee, reviewer, and cycle are required', 400, 'VALIDATION_ERROR');
    }

    const review = await PerformanceReviewModel.create({
      organizationId: new Types.ObjectId(organizationId),
      revieweeId: new Types.ObjectId(payload.revieweeId),
      reviewerId: new Types.ObjectId(payload.reviewerId),
      cycle: payload.cycle,
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
      status: 'submitted',
      goalsSnapshot: (payload.goalsSnapshot || []).map((g) => ({
        goalId: new Types.ObjectId(g.goalId),
        progress: g.progress,
      })),
      createdBy: new Types.ObjectId(userId),
    });

    await auditLogStore.add({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(userId),
      action: AuditAction.CREATE,
      resource: 'performance-review',
      resourceId: new Types.ObjectId(review._id.toString()),
      success: true,
      metadata: {
        ipAddress: 'internal',
        userAgent: 'performance-service',
        requestId,
        timestamp: new Date(),
        method: 'POST',
        url: '/api/performance/reviews',
      },
    });

    return review;
  }

  async finalizeReview(
    organizationId: string,
    reviewId: string,
    input: ReviewCompletionInput,
    userId: string,
    requestId: string
  ): Promise<IPerformanceReview> {
    validateReviewCompletionData(input);

    const review = await PerformanceReviewModel.findOne({ _id: reviewId, organizationId });
    if (!review) {
      throw new AppError('Review not found', 404, 'NOT_FOUND');
    }

    review.overallRating = input.rating;
    review.feedback = {
      strengths: input.strengths,
      improvements: input.improvements,
      summary: input.summary,
    };
    review.status = 'completed';
    review.completedAt = new Date();
    review.updatedBy = new Types.ObjectId(userId);
    await review.save();

    await auditLogStore.add({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(userId),
      action: AuditAction.UPDATE,
      resource: 'performance-review',
      resourceId: new Types.ObjectId(review._id.toString()),
      changes: { after: { status: 'completed', rating: input.rating } },
      success: true,
      metadata: {
        ipAddress: 'internal',
        userAgent: 'performance-service',
        requestId,
        timestamp: new Date(),
        method: 'PATCH',
        url: '/api/performance/reviews',
      },
    });

    return review;
  }

  async getReview(reviewId: string, organizationId: string): Promise<IPerformanceReview | null> {
    return PerformanceReviewModel.findOne({ _id: reviewId, organizationId });
  }

  async listMyReviews(organizationId: string, userId: string): Promise<IPerformanceReview[]> {
    // Need to get the employee ID from the user ID
    const { EmployeeModel } = await import('@/domains/employees/models/Employee');
    const employee = await EmployeeModel.findOne({
      userId: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(organizationId),
    });

    if (!employee) {
      return []; // No employee profile, return empty
    }

    return PerformanceReviewModel.find({
      organizationId: new Types.ObjectId(organizationId),
      $or: [
        { revieweeId: employee._id },
        { reviewerId: employee._id },
      ],
    }).sort({ createdAt: -1 });
  }

  async listReviews(organizationId: string): Promise<IPerformanceReview[]> {
    return PerformanceReviewModel.find({
      organizationId: new Types.ObjectId(organizationId),
    }).sort({ createdAt: -1 });
  }
}

export const performanceService = new PerformanceService();
