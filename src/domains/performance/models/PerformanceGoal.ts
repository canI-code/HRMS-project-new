import mongoose, { Schema, Document, Types } from 'mongoose';

export type GoalStatus = 'draft' | 'in_progress' | 'completed' | 'archived';

export interface IGoalMetric {
  name: string;
  target: number;
  current: number;
  unit?: string;
}

export interface IPerformanceGoal extends Document {
  organizationId: Types.ObjectId;
  title: string;
  description?: string;
  ownerId: Types.ObjectId;
  status: GoalStatus;
  startDate: Date;
  dueDate?: Date | null;
  progress: number;
  metrics: IGoalMetric[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GoalMetricSchema = new Schema<IGoalMetric>(
  {
    name: { type: String, required: true },
    target: { type: Number, required: true },
    current: { type: Number, default: 0 },
    unit: { type: String, default: '' },
  },
  { _id: false }
);

const PerformanceGoalSchema = new Schema<IPerformanceGoal>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    status: { type: String, enum: ['draft', 'in_progress', 'completed', 'archived'], default: 'draft', index: true },
    startDate: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    metrics: { type: [GoalMetricSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

PerformanceGoalSchema.index({ organizationId: 1, ownerId: 1, status: 1 });
PerformanceGoalSchema.index({ organizationId: 1, title: 1 });

export const PerformanceGoalModel = mongoose.model<IPerformanceGoal>('PerformanceGoal', PerformanceGoalSchema);
