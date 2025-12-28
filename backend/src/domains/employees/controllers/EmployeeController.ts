import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '@/domains/employees/services/EmployeeService';
import { Types } from 'mongoose';

export class EmployeeController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const employee = await EmployeeService.createEmployee(ctx, req.body);
      res.status(201).json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const employee = await EmployeeService.getEmployeeById(ctx, new Types.ObjectId(req.params['id'] as string));
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const employee = await EmployeeService.getEmployeeByUserId(ctx, new Types.ObjectId(ctx.userId));
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 20;
      const search = req.query['search'] as string;
      const department = req.query['department'] as string;
      const status = req.query['status'] as string;
      const employmentType = req.query['employmentType'] as string;
      const sortBy = req.query['sortBy'] as string || 'createdAt';
      const sortOrder = req.query['sortOrder'] as string || 'desc';

      const result = await EmployeeService.listEmployees(ctx, {
        page,
        limit,
        search,
        department,
        status,
        employmentType,
        sortBy,
        sortOrder,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const employee = await EmployeeService.updateEmployee(ctx, new Types.ObjectId(req.params['id'] as string), req.body);
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const employee = await EmployeeService.deleteEmployee(ctx, new Types.ObjectId(req.params['id'] as string));
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  static async setManager(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const result = await EmployeeService.setManager(
        ctx,
        new Types.ObjectId(req.params['id'] as string),
        new Types.ObjectId(req.body.managerId)
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async terminate(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const employee = await EmployeeService.terminateEmployee(
        ctx,
        new Types.ObjectId(req.params['id'] as string),
        new Date(req.body.endDate),
        req.body.reason
      );
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  static async startOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const employee = await EmployeeService.startOnboarding(
        ctx,
        new Types.ObjectId(req.params['id'] as string),
        (req.body.steps as string[]) || []
      );
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  static async completeOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = req.user!;
      const employee = await EmployeeService.completeOnboarding(ctx, new Types.ObjectId(req.params['id'] as string));
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }
}
