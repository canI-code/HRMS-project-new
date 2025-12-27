import { Request, Response, NextFunction } from 'express';
import { LeaveService } from '@/domains/leave/services/LeaveService';
import { Types } from 'mongoose';

export class LeaveController {
  static async request(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const leave = await LeaveService.requestLeave(ctx, req.body);
      res.status(201).json({ success: true, data: leave });
    } catch (error) { next(error); }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const leave = await LeaveService.getLeaveById(ctx, new Types.ObjectId(req.params['id'] as string));
      res.json({ success: true, data: leave });
    } catch (error) { next(error); }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const employeeIdStr = req.query['employeeId'] as string | undefined;
      const status = req.query['status'] as string | undefined;
      const employeeId = employeeIdStr ? new Types.ObjectId(employeeIdStr) : undefined;
      const opts: { employeeId?: Types.ObjectId; status?: any } = {};
      if (employeeId) opts.employeeId = employeeId;
      if (status) opts.status = status as any;
      const leaves = await LeaveService.listLeaves(ctx, opts as any);
      res.json({ success: true, data: leaves });
    } catch (error) { next(error); }
  }

  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const leave = await LeaveService.approveLeave(
        ctx,
        new Types.ObjectId(req.params['id'] as string),
        req.body.comments
      );
      res.json({ success: true, data: leave });
    } catch (error) { next(error); }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const leave = await LeaveService.rejectLeave(
        ctx,
        new Types.ObjectId(req.params['id'] as string),
        req.body.comments
      );
      res.json({ success: true, data: leave });
    } catch (error) { next(error); }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const leave = await LeaveService.cancelLeave(
        ctx,
        new Types.ObjectId(req.params['id'] as string),
        req.body.reason
      );
      res.json({ success: true, data: leave });
    } catch (error) { next(error); }
  }
}
