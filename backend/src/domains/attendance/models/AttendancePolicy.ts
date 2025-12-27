import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttendancePolicy extends Document {
  organizationId: Types.ObjectId;
  name: string;
  standardWorkingMinutes: number; // e.g., 480 for 8 hours
  halfDayThresholdMinutes: number; // e.g., 240 for 4 hours
  lateArrivalGraceMinutes: number; // e.g., 15 minutes
  lateArrivalThresholdMinutes: number; // When to mark as late
  overtimeStartsAfterMinutes: number; // When overtime calculation begins
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttendancePolicySchema = new Schema<IAttendancePolicy>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    standardWorkingMinutes: {
      type: Number,
      required: true,
      min: 0,
    },
    halfDayThresholdMinutes: {
      type: Number,
      required: true,
      min: 0,
    },
    lateArrivalGraceMinutes: {
      type: Number,
      required: true,
      min: 0,
      default: 15,
    },
    lateArrivalThresholdMinutes: {
      type: Number,
      required: true,
      min: 0,
    },
    overtimeStartsAfterMinutes: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

AttendancePolicySchema.index({ organizationId: 1, isActive: 1 });

export const AttendancePolicyModel = mongoose.model<IAttendancePolicy>(
  'AttendancePolicy',
  AttendancePolicySchema
);
