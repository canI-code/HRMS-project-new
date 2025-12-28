import { Request, Response, NextFunction } from 'express';
import { LeaveService } from '@/domains/leave/services/LeaveService';
import { Types } from 'mongoose';
import { EmployeeModel } from '@/domains/employees/models/Employee';
import { AppError } from '@/shared/utils/AppError';

async function getCurrentEmployeeId(ctx: any) {
  const emp = await EmployeeModel.findOne({
    organizationId: new Types.ObjectId(ctx.organizationId),
    userId: new Types.ObjectId(ctx.userId),
    isDeleted: { $ne: true },
  });
  if (!emp) {
    throw new AppError('Employee record not found for current user', 404, 'EMPLOYEE_NOT_FOUND');
  }
  return emp._id;
}

function serializeLeave(leave: any) {
  const obj = leave.toObject ? leave.toObject() : leave;
  return {
    ...obj,
    comments: obj.approverComments,
    leaveType: obj.type,
  };
}

export class LeaveController {
  static async request(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const body = { ...req.body };

      // Get the current user's employee ID
      const selfEmpId = await getCurrentEmployeeId(ctx);

      if (ctx.userRole === 'employee') {
        // Employees can only request leave for themselves
        if (body.employeeId && body.employeeId !== selfEmpId.toString()) {
          throw new AppError('Employees can only request leave for themselves', 403, 'INSUFFICIENT_PERMISSIONS');
        }
        body.employeeId = selfEmpId.toString();
      } else {
        // Managers/admins: if no employeeId provided, default to their own
        if (!body.employeeId) {
          body.employeeId = selfEmpId.toString();
        }
      }

      const payload = {
        organizationId: new Types.ObjectId(ctx.organizationId),
        employeeId: new Types.ObjectId(body.employeeId),
        type: body.leaveType || body.type,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        reason: body.reason,
      };

      const leave = await LeaveService.requestLeave(ctx, payload as any);
      res.status(201).json({ success: true, data: serializeLeave(leave) });
    } catch (error) { next(error); }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const leave = await LeaveService.getLeaveById(ctx, new Types.ObjectId(req.params['id'] as string));
      if (ctx.userRole === 'employee') {
        const selfEmpId = await getCurrentEmployeeId(ctx);
        if (!leave.employeeId.equals(selfEmpId)) {
          throw new AppError('Employees can only view their own leave', 403, 'INSUFFICIENT_PERMISSIONS');
        }
      }
      res.json({ success: true, data: serializeLeave(leave) });
    } catch (error) { next(error); }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      let employeeIdStr = req.query['employeeId'] as string | undefined;
      const status = req.query['status'] as string | undefined;
      const showAll = req.query['showAll'] === 'true';

      const selfEmpId = await getCurrentEmployeeId(ctx);

      // For "My Leaves" view, always filter to current user's leaves
      if (!showAll || ctx.userRole === 'employee') {
        employeeIdStr = selfEmpId.toString();
      }

      const opts: { employeeId?: string; status?: any; excludeEmployeeId?: string } = {};
      if (employeeIdStr) opts.employeeId = employeeIdStr;
      if (status) opts.status = status as any;
      
      // For Team Leaves (showAll=true), exclude current user's leaves
      if (showAll && ctx.userRole !== 'employee') {
        opts.excludeEmployeeId = selfEmpId.toString();
      }

      const leaves = await LeaveService.listLeaves(ctx, {
        employeeId: opts.employeeId ? new Types.ObjectId(opts.employeeId) : undefined,
        status: opts.status,
        excludeEmployeeId: opts.excludeEmployeeId ? new Types.ObjectId(opts.excludeEmployeeId) : undefined,
      } as any);
      res.json({ success: true, data: leaves.map(serializeLeave) });
    } catch (error) { next(error); }
  }

  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      if (ctx.userRole === 'employee') {
        throw new AppError('Only managers or admins can approve leave', 403, 'INSUFFICIENT_PERMISSIONS');
      }
      const leave = await LeaveService.approveLeave(
        ctx,
        new Types.ObjectId(req.params['id'] as string),
        req.body.comments
      );
      res.json({ success: true, data: serializeLeave(leave) });
    } catch (error) { next(error); }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      if (ctx.userRole === 'employee') {
        throw new AppError('Only managers or admins can reject leave', 403, 'INSUFFICIENT_PERMISSIONS');
      }
      const leave = await LeaveService.rejectLeave(
        ctx,
        new Types.ObjectId(req.params['id'] as string),
        req.body.comments
      );
      res.json({ success: true, data: serializeLeave(leave) });
    } catch (error) { next(error); }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const leaveId = new Types.ObjectId(req.params['id'] as string);
      const leave = await LeaveService.getLeaveById(ctx, leaveId);

      // Only the employee who requested the leave can cancel it
      const selfEmpId = await getCurrentEmployeeId(ctx);
      if (!leave.employeeId.equals(selfEmpId)) {
        throw new AppError('You can only cancel your own leave', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      const updated = await LeaveService.cancelLeave(
        ctx,
        leaveId,
        req.body.reason
      );
      res.json({ success: true, data: serializeLeave(updated) });
    } catch (error) { next(error); }
  }
}
