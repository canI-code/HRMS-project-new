import { Types } from 'mongoose';
import { LeaveModel, LeaveStatus, LeaveType } from '@/domains/leave/models/Leave';
import { auditLogStore } from '@/shared/middleware/auditLogger';
import { AuditAction, RequestContext } from '@/shared/types/common';
import { AppError } from '@/shared/utils/AppError';

export interface RequestLeaveInput {
  organizationId: Types.ObjectId;
  employeeId: Types.ObjectId;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export class LeaveService {
  static async requestLeave(ctx: RequestContext, input: RequestLeaveInput) {
    // Simple overlap prevention: ensure no approved leave overlaps the requested window
    const overlapping = await LeaveModel.findOne({
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      status: LeaveStatus.APPROVED,
      $or: [
        { startDate: { $lte: input.endDate }, endDate: { $gte: input.startDate } },
      ],
      isDeleted: { $ne: true },
    });
    if (overlapping) {
      throw new AppError('Leave request overlaps an approved leave', 400, 'LEAVE_OVERLAP');
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const inclusiveDays = Math.max(1, Math.floor((input.endDate.getTime() - input.startDate.getTime()) / msPerDay) + 1);
    const leave = await LeaveModel.create({
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      days: inclusiveDays,
      status: LeaveStatus.PENDING,
      reason: input.reason,
      requestedBy: ctx.userId,
    });

    LeaveService.log(ctx, AuditAction.CREATE, 'leaves', leave._id, undefined, leave);
    return leave;
  }

  static async getLeaveById(ctx: RequestContext, leaveId: Types.ObjectId) {
    const leave = await LeaveModel.findOne({ _id: leaveId, organizationId: ctx.organizationId, isDeleted: { $ne: true } });
    if (!leave) throw new AppError('Leave not found', 404, 'LEAVE_NOT_FOUND');
    return leave;
  }

  static async listLeaves(ctx: RequestContext, { employeeId, status, excludeEmployeeId }: { employeeId?: Types.ObjectId; status?: LeaveStatus; excludeEmployeeId?: Types.ObjectId } = {}) {
    const q: any = { organizationId: ctx.organizationId, isDeleted: { $ne: true } };
    if (employeeId) q.employeeId = employeeId;
    if (status) q.status = status;
    if (excludeEmployeeId) q.employeeId = { $ne: excludeEmployeeId };
    return await LeaveModel.find(q).populate('employeeId', 'firstName lastName email').limit(100);
  }

  static async approveLeave(ctx: RequestContext, leaveId: Types.ObjectId, approverComments?: string) {
    const before = await LeaveService.getLeaveById(ctx, leaveId);
    if (before.status !== LeaveStatus.PENDING) {
      throw new AppError('Only pending leaves can be approved', 400, 'LEAVE_INVALID_STATE');
    }
    const updated = await LeaveModel.findOneAndUpdate(
      { _id: leaveId, organizationId: ctx.organizationId },
      { $set: { status: LeaveStatus.APPROVED, approverComments, approvedBy: ctx.userId } },
      { new: true }
    );
    if (!updated) throw new AppError('Leave approval failed', 400, 'LEAVE_APPROVAL_FAILED');
    LeaveService.log(ctx, AuditAction.UPDATE, 'leaves', leaveId, before, updated);
    return updated;
  }

  static async rejectLeave(ctx: RequestContext, leaveId: Types.ObjectId, approverComments?: string) {
    const before = await LeaveService.getLeaveById(ctx, leaveId);
    if (before.status !== LeaveStatus.PENDING) {
      throw new AppError('Only pending leaves can be rejected', 400, 'LEAVE_INVALID_STATE');
    }
    const updated = await LeaveModel.findOneAndUpdate(
      { _id: leaveId, organizationId: ctx.organizationId },
      { $set: { status: LeaveStatus.REJECTED, approverComments, rejectedBy: ctx.userId } },
      { new: true }
    );
    if (!updated) throw new AppError('Leave rejection failed', 400, 'LEAVE_REJECTION_FAILED');
    LeaveService.log(ctx, AuditAction.UPDATE, 'leaves', leaveId, before, updated);
    return updated;
  }

  static async cancelLeave(ctx: RequestContext, leaveId: Types.ObjectId, reason?: string) {
    const before = await LeaveService.getLeaveById(ctx, leaveId);
    if (before.status === LeaveStatus.CANCELLED) {
      throw new AppError('Leave already cancelled', 400, 'LEAVE_ALREADY_CANCELLED');
    }
    const updated = await LeaveModel.findOneAndUpdate(
      { _id: leaveId, organizationId: ctx.organizationId },
      { $set: { status: LeaveStatus.CANCELLED, approverComments: reason, cancelledBy: ctx.userId } },
      { new: true }
    );
    if (!updated) throw new AppError('Leave cancellation failed', 400, 'LEAVE_CANCELLATION_FAILED');
    LeaveService.log(ctx, AuditAction.UPDATE, 'leaves', leaveId, before, updated);
    return updated;
  }

  private static log(
    ctx: RequestContext,
    action: AuditAction,
    resource: string,
    resourceId: Types.ObjectId,
    before?: unknown,
    after?: unknown
  ) {
    const entry: any = {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action,
      resource,
      resourceId,
      metadata: {
        ipAddress: ctx.ipAddress || '127.0.0.1',
        userAgent: ctx.userAgent || 'tests',
        requestId: ctx.requestId || 'service-call',
        timestamp: new Date(),
        method: 'SERVICE',
        url: `/service/${resource}`,
        statusCode: 200,
        duration: 0,
      },
      success: true,
    };
    if (before !== undefined || after !== undefined) {
      entry.changes = { before, after };
    }
    auditLogStore.add(entry);
  }
}
