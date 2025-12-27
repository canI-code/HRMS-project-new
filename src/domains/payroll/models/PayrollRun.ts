import mongoose, { Schema, Document, Types } from 'mongoose';

export type PayrollRunStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IPayrollRun extends Document {
  organizationId: Types.ObjectId;
  salaryStructureId: Types.ObjectId;
  structureVersion: number;
  periodStart: Date;
  periodEnd: Date;
  status: PayrollRunStatus;
  locked: boolean;
  totals: {
    gross: number; // minor units (may include fractional minor units before rounding)
    deductions: number;
    net: number;
  };
  createdBy: Types.ObjectId;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollRunSchema = new Schema<IPayrollRun>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    salaryStructureId: { type: Schema.Types.ObjectId, ref: 'SalaryStructure', required: true },
    structureVersion: { type: Number, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending', index: true },
    locked: { type: Boolean, default: false },
    totals: {
      gross: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 },
      net: { type: Number, default: 0 },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String },
  },
  { timestamps: true }
);

PayrollRunSchema.index({ organizationId: 1, periodStart: 1, periodEnd: 1 });

// Prevent mutation once locked/completed
PayrollRunSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;
  if (update && update.$set && update.$set.locked) {
    return next();
  }
  next(new Error('PayrollRun is locked/immutable after completion.'));
});
PayrollRunSchema.pre('updateOne', function (next) {
  next(new Error('PayrollRun updates are not allowed after creation; use service transitions only.'));
});
PayrollRunSchema.pre('updateMany', function (next) {
  next(new Error('PayrollRun updates are not allowed after creation; use service transitions only.'));
});

export const PayrollRunModel = mongoose.model<IPayrollRun>('PayrollRun', PayrollRunSchema);
