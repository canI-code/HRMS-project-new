import mongoose, { Schema, Document, Types } from 'mongoose';

export type ReviewStatus = 'draft' | 'submitted' | 'completed';

export interface IReviewFeedback {
  strengths?: string | undefined;
  improvements?: string | undefined;
  summary?: string | undefined;
}

export interface IGoalSnapshot {
  goalId: Types.ObjectId;
  progress: number;
}

export interface IPerformanceReview extends Document {
  organizationId: Types.ObjectId;
  revieweeId: Types.ObjectId;
  reviewerId: Types.ObjectId;
  cycle: string;
  periodStart: Date;
  periodEnd: Date;
  status: ReviewStatus;
  overallRating?: number;
  feedback?: IReviewFeedback;
  goalsSnapshot?: IGoalSnapshot[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IReviewFeedback>(
  {
    strengths: { type: String },
    improvements: { type: String },
    summary: { type: String },
  },
  { _id: false }
);

const GoalSnapshotSchema = new Schema<IGoalSnapshot>(
  {
    goalId: { type: Schema.Types.ObjectId, ref: 'PerformanceGoal', required: true },
    progress: { type: Number, required: true },
  },
  { _id: false }
);

const PerformanceReviewSchema = new Schema<IPerformanceReview>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    revieweeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cycle: { type: String, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    status: { type: String, enum: ['draft', 'submitted', 'completed'], default: 'draft', index: true },
    overallRating: { type: Number, min: 1, max: 5 },
    feedback: { type: FeedbackSchema, default: undefined },
    goalsSnapshot: { type: [GoalSnapshotSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

PerformanceReviewSchema.index({ organizationId: 1, revieweeId: 1, cycle: 1 });

export const PerformanceReviewModel = mongoose.model<IPerformanceReview>('PerformanceReview', PerformanceReviewSchema);
