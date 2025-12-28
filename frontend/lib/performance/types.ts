export type GoalStatus = 'draft' | 'in_progress' | 'completed' | 'archived';
export type ReviewStatus = 'draft' | 'submitted' | 'completed';

export interface GoalMetric {
  name: string;
  target: number;
  current: number;
  unit?: string;
}

export interface PerformanceGoal {
  _id: string;
  organizationId: string;
  title: string;
  description?: string;
  ownerId: string;
  status: GoalStatus;
  startDate: string;
  dueDate?: string | null;
  progress: number;
  metrics: GoalMetric[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFeedback {
  strengths?: string;
  improvements?: string;
  summary?: string;
}

export interface GoalSnapshot {
  goalId: string;
  progress: number;
}

export interface PerformanceReview {
  _id: string;
  organizationId: string;
  revieweeId: string;
  reviewerId: string;
  cycle: string;
  periodStart: string;
  periodEnd: string;
  status: ReviewStatus;
  overallRating?: number;
  feedback?: ReviewFeedback;
  goalsSnapshot?: GoalSnapshot[];
  createdBy?: string;
  updatedBy?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalPayload {
  title: string;
  description?: string;
  ownerId?: string; // Optional - backend will use logged-in user's employee ID if not provided
  startDate?: string;
  dueDate?: string | null;
  metrics?: { name: string; target: number; current?: number; unit?: string }[];
}

export interface UpdateGoalProgressPayload {
  delta: number;
}

export interface CreateReviewPayload {
  revieweeId?: string; // Optional - backend will use logged-in user's employee ID if not provided
  reviewerId?: string; // Optional - backend will use logged-in user's employee ID if not provided
  cycle: string;
  periodStart: string;
  periodEnd: string;
  goalsSnapshot?: { goalId: string; progress: number }[];
}

export interface CompleteReviewPayload {
  rating: number;
  strengths: string;
  improvements: string;
  summary?: string;
}
