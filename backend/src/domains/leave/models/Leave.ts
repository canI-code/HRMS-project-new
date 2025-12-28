import { Schema, model, Types } from 'mongoose';
import { BaseDocument } from '@/shared/types/common';

export enum LeaveType {
  EARNED = 'earned',
  SICK = 'sick',
  UNPAID = 'unpaid',
  CASUAL = 'casual',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export interface Leave extends BaseDocument {
  organizationId: Types.ObjectId;
  employeeId: Types.ObjectId;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number; // inclusive day count
  status: LeaveStatus;
  reason?: string;
  approverComments?: string;
  requestedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  rejectedBy?: Types.ObjectId;
  cancelledBy?: Types.ObjectId;
  isDeleted?: boolean;
}

const LeaveSchema = new Schema<Leave>({
  organizationId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Organization' },
  employeeId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Employee' },
  type: { type: String, enum: Object.values(LeaveType), required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, required: true, min: 1 },
  status: { type: String, enum: Object.values(LeaveStatus), required: true, default: LeaveStatus.PENDING },
  reason: { type: String },
  approverComments: { type: String },
  requestedBy: { type: Schema.Types.ObjectId, required: true },
  approvedBy: { type: Schema.Types.ObjectId },
  rejectedBy: { type: Schema.Types.ObjectId },
  cancelledBy: { type: Schema.Types.ObjectId },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// Indexes for querying by employee and status
LeaveSchema.index({ organizationId: 1, employeeId: 1, status: 1 });

// Validation hooks
LeaveSchema.pre('validate', function(next) {
  const start = this.startDate;
  const end = this.endDate;
  if (start && end && end < start) {
    return next(new Error('End date cannot be before start date'));
  }
  // compute inclusive days if not set or incorrect
  if (start && end) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const diff = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
    this.days = Math.max(diff, 1);
  }
  next();
});

export const LeaveModel = model<Leave>('Leave', LeaveSchema);
