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

import { LeavePolicyService } from '@/domains/leave/services/LeavePolicyService';

export class LeaveService {
  static async getBalances(ctx: RequestContext, employeeId: Types.ObjectId) {
    // 1. Get Policy
    const policy = await LeavePolicyService.getPolicy(ctx);

    const allocations = policy?.allocations || [
      { leaveType: "casual", totalDays: 12 },
      { leaveType: "sick", totalDays: 10 },
      { leaveType: "earned", totalDays: 15 },
      { leaveType: "unpaid", totalDays: 0 },
    ];

    // 2. Get Used Leaves (Approved & Pending) for current year
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    // We only sum up APPROVED leaves for "Used", maybe pending too depending on policy.
    // Usually pending reduces "Available" balance to prevent over-request.
    const usedLeaves = await LeaveModel.find({
      organizationId: ctx.organizationId,
      employeeId: employeeId,
      status: { $in: [LeaveStatus.APPROVED, LeaveStatus.PENDING] },
      startDate: { $gte: startOfYear },
      isDeleted: { $ne: true },
    });

    const usedMap: Record<string, number> = {};
    usedLeaves.forEach(leave => {
      usedMap[leave.type] = (usedMap[leave.type] || 0) + leave.days;
    });

    // 3. Calculate Balance
    const balances = allocations.map(alloc => {
      const used = usedMap[alloc.leaveType] || 0;
      return {
        leaveType: alloc.leaveType,
        total: alloc.totalDays,
        used,
        available: Math.max(0, alloc.totalDays - used),
      };
    });

    // Add types found in used but not in policy (e.g. old types)
    // Optional, but good for completeness if policy changed.

    return balances;
  }
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

    // Validate Balance
    const balances = await LeaveService.getBalances(ctx, input.employeeId);
    const balance = balances.find(b => b.leaveType === input.type);

    // If leave type not in policy config? (Should be allowed or blocked? Assuming allowed if not in policy means unlimited OR blocked. 
    // Current getBalances logic returns balances derived from policy. If type not in policy, it won't be in balances array.)
    // But what if we allow ad-hoc types? "unpaid" is default in getBalances fallback. 
    // Let's strictly enforce: must have available balance.

    // Special case: "unpaid" might be unlimited if configured with 0 days but we want to allow it?
    // User said "if the days left is shown 0 then diable the submit button". 
    // And "for casual it was 2 dasy more ... then the balace whould reduce to 0."
    // So we should enforce limits.

    if (balance) {
      if (inclusiveDays > balance.available) {
        throw new AppError(`Insufficient leave balance. Available: ${balance.available}, Requested: ${inclusiveDays}`, 400, 'INSUFFICIENT_BALANCE');
      }
    } else {
      // If type not found in balances (meaning not in policy), maybe block or allow?
      // Safest to block if we want strict policy control.
      throw new AppError(`Leave type '${input.type}' is not enabled in policy`, 400, 'INVALID_LEAVE_TYPE');
    }

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

    // Trigger Notification
    try {
      const { notificationService } = await import('@/domains/notifications/services/NotificationService');
      const { User: UserModel } = await import('@/domains/auth/models/User');

      // Find all admins to notify
      const admins = await UserModel.find({
        organizationId: input.organizationId,
        role: { $in: ['hr_admin', 'super_admin'] }
      });

      if (admins.length > 0) {
        await notificationService.sendWorkflowNotification(
          ctx.organizationId.toString(),
          {
            templateName: 'LEAVE_REQUESTED',
            category: 'leave',
            recipients: admins.map(a => ({ userId: a._id.toString() })),
            payload: {
              leaveId: leave._id.toString(),
              employeeId: input.employeeId.toString(),
              startDate: input.startDate,
              endDate: input.endDate,
              type: input.type,
              days: inclusiveDays
            },
          },
          ctx.userId.toString(),
          ctx.requestId || 'unknown'
        );
      }
    } catch (error) {
      console.warn('Failed to send LEAVE_REQUESTED notification:', error);
    }

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
    return await LeaveModel.find(q).populate('employeeId', 'firstName lastName email employeeCode professional.title').limit(100);
  }

  static async approveLeave(ctx: RequestContext, leaveId: Types.ObjectId, approverComments?: string) {
    const leave = await LeaveService.getLeaveById(ctx, leaveId);
    if (leave.status !== LeaveStatus.PENDING) {
      throw new AppError('Only pending leaves can be approved', 400, 'LEAVE_INVALID_STATE');
    }

    // Role-based Approval Hierarchy
    // 1. No self-approval
    if (leave.requestedBy.equals(ctx.userId)) {
      throw new AppError('You cannot approve your own leave request', 403, 'SELF_APPROVAL_FORBIDDEN');
    }

    // 2. Hierarchy Check
    // We need to know the role of the applicant (requestedBy).
    // Assuming we can't easily look up user role without importing AuthService or UserModel, 
    // but we can infer from Context if we had it, or we query User provided we have Model access.
    // Let's import UserModel.
    const UserModel = (await import('@/domains/auth/models/User')).User;
    const applicant = await UserModel.findById(leave.requestedBy);

    if (!applicant) throw new AppError('Applicant not found', 404, 'USER_NOT_FOUND');

    // applicant.role is a string enum.
    const applicantRole = applicant.role;

    const approverRole = ctx.userRole; // Assuming this is set correctly in ctx

    // Rules:
    // Employee/Manager -> Approved by Admin (hr_admin) or Super Admin
    // Admin (hr_admin) -> Approved by Super Admin
    // Super Admin -> Approved by Admin (hr_admin)

    if (applicantRole === 'employee' || applicantRole === 'manager') {
      if (!['hr_admin', 'super_admin'].includes(approverRole)) {
        throw new AppError('Employees/Managers must be approved by Admin or Super Admin', 403, 'INSUFFICIENT_PERMISSIONS');
      }
    } else if (applicantRole === 'hr_admin') {
      if (approverRole !== 'super_admin') {
        throw new AppError('Admins must be approved by Super Admin', 403, 'INSUFFICIENT_PERMISSIONS');
      }
    } else if (applicantRole === 'super_admin') {
      if (approverRole !== 'hr_admin') {
        throw new AppError('Super Admins must be approved by Admin', 403, 'INSUFFICIENT_PERMISSIONS');
      }
    }

    const updated = await LeaveModel.findOneAndUpdate(
      { _id: leaveId, organizationId: ctx.organizationId },
      { $set: { status: LeaveStatus.APPROVED, approverComments, approvedBy: ctx.userId } },
      { new: true }
    );
    if (!updated) throw new AppError('Leave approval failed', 400, 'LEAVE_APPROVAL_FAILED');
    LeaveService.log(ctx, AuditAction.UPDATE, 'leaves', leaveId, leave, updated);

    // Trigger Notification
    try {
      const { notificationService } = await import('@/domains/notifications/services/NotificationService');
      await notificationService.sendWorkflowNotification(
        ctx.organizationId.toString(),
        {
          templateName: 'LEAVE_APPROVED',
          category: 'leave',
          recipients: [{ userId: leave.requestedBy.toString() }],
          payload: {
            leaveId: leaveId.toString(),
            startDate: leave.startDate,
            endDate: leave.endDate,
            type: leave.type,
            approverComments,
          },
        },
        ctx.userId.toString(),
        ctx.requestId || 'unknown'
      );
    } catch (error) {
      console.warn('Failed to send LEAVE_APPROVED notification:', error);
    }

    return updated;
  }

  static async rejectLeave(ctx: RequestContext, leaveId: Types.ObjectId, approverComments?: string) {
    const leave = await LeaveService.getLeaveById(ctx, leaveId);
    if (leave.status !== LeaveStatus.PENDING) {
      throw new AppError('Only pending leaves can be rejected', 400, 'LEAVE_INVALID_STATE');
    }

    // Role-based Rejection Hierarchy (Same as approval usually)
    if (leave.requestedBy.equals(ctx.userId)) {
      throw new AppError('You cannot reject your own leave request', 403, 'SELF_APPROVAL_FORBIDDEN');
    }

    // Duplicate hierarchy logic or refactor. For brevity, I'll duplicate essential checks or assume same validation applies.
    // Getting applicant again
    const UserModel = (await import('@/domains/auth/models/User')).User;
    const applicant = await UserModel.findById(leave.requestedBy);
    if (!applicant) throw new AppError('Applicant not found', 404, 'USER_NOT_FOUND');

    const applicantRole = applicant.role;
    const approverRole = ctx.userRole;

    if (applicantRole === 'employee' || applicantRole === 'manager') {
      if (!['hr_admin', 'super_admin'].includes(approverRole)) {
        throw new AppError('Insufficient permissions to reject this request', 403, 'INSUFFICIENT_PERMISSIONS');
      }
    } else if (applicantRole === 'hr_admin') {
      if (approverRole !== 'super_admin') {
        throw new AppError('Insufficient permissions to reject this request', 403, 'INSUFFICIENT_PERMISSIONS');
      }
    } else if (applicantRole === 'super_admin') {
      if (approverRole !== 'hr_admin') {
        throw new AppError('Insufficient permissions to reject this request', 403, 'INSUFFICIENT_PERMISSIONS');
      }
    }

    const updated = await LeaveModel.findOneAndUpdate(
      { _id: leaveId, organizationId: ctx.organizationId },
      { $set: { status: LeaveStatus.REJECTED, approverComments, rejectedBy: ctx.userId } },
      { new: true }
    );
    if (!updated) throw new AppError('Leave rejection failed', 400, 'LEAVE_REJECTION_FAILED');
    LeaveService.log(ctx, AuditAction.UPDATE, 'leaves', leaveId, leave, updated);

    // Trigger Notification
    try {
      const { notificationService } = await import('@/domains/notifications/services/NotificationService');
      await notificationService.sendWorkflowNotification(
        ctx.organizationId.toString(),
        {
          templateName: 'LEAVE_REJECTED',
          category: 'leave',
          recipients: [{ userId: leave.requestedBy.toString() }],
          payload: {
            leaveId: leaveId.toString(),
            startDate: leave.startDate,
            endDate: leave.endDate,
            type: leave.type,
            reason: approverComments,
          },
        },
        ctx.userId.toString(),
        ctx.requestId || 'unknown'
      );
    } catch (error) {
      console.warn('Failed to send LEAVE_REJECTED notification:', error);
    }

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
