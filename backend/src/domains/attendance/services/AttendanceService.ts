import { Types } from 'mongoose';
import { AttendanceModel, IAttendanceRecord } from '../models/Attendance';
import { AttendancePolicyModel, IAttendancePolicy } from '../models/AttendancePolicy';
import { auditLogStore } from '@/shared/middleware/auditLogger';
import { AppError } from '@/shared/utils/AppError';
import { AuditAction } from '@/shared/types/common';

export class AttendanceService {
  async checkIn(
    employeeId: string,
    organizationId: string,
    checkInTime: Date,
    userId: string,
    requestId: string
  ): Promise<IAttendanceRecord> {
    const date = new Date(checkInTime);
    date.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existing = await AttendanceModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      organizationId: new Types.ObjectId(organizationId),
      date,
    });

    if (existing && existing.checkIn) {
      throw new AppError(
        'Already checked in today',
        400,
        'ALREADY_CHECKED_IN'
      );
    }

    // Create attendance record
    const record = await AttendanceModel.create({
      employeeId: new Types.ObjectId(employeeId),
      organizationId: new Types.ObjectId(organizationId),
      date,
      checkIn: checkInTime,
      status: 'present',
    });

    // Check if late according to policy
    const policy = await this.getActivePolicy(organizationId);
    if (policy) {
      const checkInMinutes =
        checkInTime.getHours() * 60 + checkInTime.getMinutes();
      const graceMinutes = policy.lateArrivalGraceMinutes || 0;
      const thresholdMinutes = policy.lateArrivalThresholdMinutes || 0;

      if (checkInMinutes > graceMinutes + thresholdMinutes) {
        record.status = 'late';
        await record.save();
      }
    }

    // Audit log
    const auditEntry: any = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(organizationId),
      action: AuditAction.CREATE,
      resource: 'attendance',
      changes: { after: { checkIn: checkInTime, status: record.status } },
      success: true,
      metadata: {
        ipAddress: '',
        userAgent: '',
        requestId,
        timestamp: new Date(),
        method: 'POST',
        url: '/api/attendance/check-in',
      },
    };
    if (record._id) {
      auditEntry.resourceId = new Types.ObjectId(record._id.toString());
    }
    await auditLogStore.add(auditEntry);

    return record;
  }

  async checkOut(
    employeeId: string,
    organizationId: string,
    checkOutTime: Date,
    userId: string,
    requestId: string,
    breakMinutes = 0
  ): Promise<IAttendanceRecord> {
    const date = new Date(checkOutTime);
    date.setHours(0, 0, 0, 0);

    const record = await AttendanceModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      organizationId: new Types.ObjectId(organizationId),
      date,
    });

    if (!record) {
      throw new AppError('No check-in record found for today', 404, 'NOT_FOUND');
    }

    if (!record.checkIn) {
      throw new AppError(
        'Employee has not checked in yet',
        400,
        'NOT_CHECKED_IN'
      );
    }

    if (record.checkOut) {
      throw new AppError(
        'Already checked out today',
        400,
        'ALREADY_CHECKED_OUT'
      );
    }

    record.checkOut = checkOutTime;
    record.breakMinutes = breakMinutes;

    // Calculate working minutes
    const totalMinutes = Math.floor(
      (checkOutTime.getTime() - record.checkIn.getTime()) / (1000 * 60)
    );
    record.workingMinutes = Math.max(0, totalMinutes - breakMinutes);

    // Apply policy for overtime
    const policy = await this.getActivePolicy(organizationId);
    if (policy && policy.overtimeStartsAfterMinutes) {
      const overtimeMinutes =
        record.workingMinutes - policy.overtimeStartsAfterMinutes;
      if (overtimeMinutes > 0) {
        record.overtimeMinutes = overtimeMinutes;
      }
    }

    // Check if half day
    if (
      policy &&
      policy.halfDayThresholdMinutes &&
      record.workingMinutes < policy.halfDayThresholdMinutes
    ) {
      record.status = 'half-day';
    }

    await record.save();

    // Audit log
    const changes: Record<string, unknown> = {
      checkOut: checkOutTime,
      breakMinutes,
      workingMinutes: record.workingMinutes,
    };
    if (record.overtimeMinutes) {
      changes['overtimeMinutes'] = record.overtimeMinutes;
    }

    const auditEntry: any = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(organizationId),
      action: AuditAction.UPDATE,
      resource: 'attendance',
      changes: { after: changes },
      success: true,
      metadata: {
        ipAddress: '',
        userAgent: '',
        requestId,
        timestamp: new Date(),
        method: 'POST',
        url: '/api/attendance/check-out',
      },
    };
    if (record._id) {
      auditEntry.resourceId = new Types.ObjectId(record._id.toString());
    }
    await auditLogStore.add(auditEntry);

    return record;
  }

  async getAttendanceByDate(
    employeeId: string,
    organizationId: string,
    date: Date
  ): Promise<IAttendanceRecord | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return AttendanceModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      organizationId: new Types.ObjectId(organizationId),
      date: startOfDay,
    });
  }

  async getMonthlyAttendance(
    employeeId: string,
    organizationId: string,
    year: number,
    month: number
  ): Promise<{
    records: IAttendanceRecord[];
    summary: {
      totalDays: number;
      presentDays: number;
      absentDays: number;
      lateDays: number;
      halfDays: number;
      totalWorkingMinutes: number;
      totalOvertimeMinutes: number;
    };
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const records = await AttendanceModel.find({
      employeeId: new Types.ObjectId(employeeId),
      organizationId: new Types.ObjectId(organizationId),
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    const summary = {
      totalDays: records.length,
      presentDays: records.filter((r) => r.status === 'present').length,
      absentDays: records.filter((r) => r.status === 'absent').length,
      lateDays: records.filter((r) => r.status === 'late').length,
      halfDays: records.filter((r) => r.status === 'half-day').length,
      totalWorkingMinutes: records.reduce(
        (sum, r) => sum + (r.workingMinutes || 0),
        0
      ),
      totalOvertimeMinutes: records.reduce(
        (sum, r) => sum + (r.overtimeMinutes || 0),
        0
      ),
    };

    return { records, summary };
  }

  async markAbsent(
    employeeId: string,
    organizationId: string,
    date: Date,
    userId: string,
    requestId: string,
    notes?: string
  ): Promise<IAttendanceRecord> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const existing = await AttendanceModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      organizationId: new Types.ObjectId(organizationId),
      date: startOfDay,
    });

    if (existing) {
      throw new AppError(
        'Attendance record already exists for this date',
        400,
        'ALREADY_EXISTS'
      );
    }

    const record = await AttendanceModel.create({
      employeeId: new Types.ObjectId(employeeId),
      organizationId: new Types.ObjectId(organizationId),
      date: startOfDay,
      status: 'absent',
      notes,
    });

    // Audit log
    const auditEntry: any = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(organizationId),
      action: AuditAction.CREATE,
      resource: 'attendance',
      changes: { after: { status: 'absent', notes } },
      success: true,
      metadata: {
        ipAddress: '',
        userAgent: '',
        requestId,
        timestamp: new Date(),
        method: 'POST',
        url: '/api/attendance/mark-absent',
      },
    };
    if (record._id) {
      auditEntry.resourceId = new Types.ObjectId(record._id.toString());
    }
    await auditLogStore.add(auditEntry);

    return record;
  }

  private async getActivePolicy(
    organizationId: string
  ): Promise<IAttendancePolicy | null> {
    return AttendancePolicyModel.findOne({
      organizationId: new Types.ObjectId(organizationId),
      isActive: true,
    });
  }

  async upsertPolicy(
    organizationId: string,
    policyData: Partial<IAttendancePolicy>,
    userId: string,
    requestId: string
  ): Promise<IAttendancePolicy> {
    // Deactivate existing policies
    await AttendancePolicyModel.updateMany(
      { organizationId: new Types.ObjectId(organizationId), isActive: true },
      { $set: { isActive: false } }
    );

    const policy = await AttendancePolicyModel.create({
      ...policyData,
      organizationId: new Types.ObjectId(organizationId),
      isActive: true,
    });

    // Audit log
    const auditEntry: any = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(organizationId),
      action: AuditAction.CREATE,
      resource: 'attendance-policy',
      changes: { after: policyData },
      success: true,
      metadata: {
        ipAddress: '',
        userAgent: '',
        requestId,
        timestamp: new Date(),
        method: 'POST',
        url: '/api/attendance/policy',
      },
    };
    if (policy._id) {
      auditEntry.resourceId = new Types.ObjectId(policy._id.toString());
    }
    await auditLogStore.add(auditEntry);

    return policy;
  }
}

export const attendanceService = new AttendanceService();
