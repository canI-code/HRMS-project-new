import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttendanceRecord extends Document {
  employeeId: Types.ObjectId;
  organizationId: Types.ObjectId;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  workingMinutes?: number;
  breakMinutes?: number;
  overtimeMinutes?: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendanceRecord>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    workingMinutes: {
      type: Number,
      min: 0,
    },
    breakMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    overtimeMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'on-leave'],
      required: true,
      index: true,
    },
    notes: String,
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ organizationId: 1, date: 1 });
AttendanceSchema.index({ organizationId: 1, employeeId: 1, date: -1 });

// Validation: checkOut must be after checkIn
AttendanceSchema.pre('validate', function (next) {
  if (this.checkIn && this.checkOut && this.checkOut <= this.checkIn) {
    next(new Error('Check-out time must be after check-in time'));
  } else {
    next();
  }
});

// Calculate working minutes if both check-in and check-out are present
AttendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut && !this.isModified('workingMinutes')) {
    const totalMinutes = Math.floor(
      (this.checkOut.getTime() - this.checkIn.getTime()) / (1000 * 60)
    );
    this.workingMinutes = Math.max(0, totalMinutes - (this.breakMinutes || 0));
  }
  next();
});

export const AttendanceModel = mongoose.model<IAttendanceRecord>(
  'Attendance',
  AttendanceSchema
);
