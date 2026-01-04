import { Request, Response, NextFunction } from 'express';
import { attendanceService } from '../services/AttendanceService';
import { AppError } from '../../../shared/utils/AppError';
import { Types } from 'mongoose';
import { EmployeeModel } from '@/domains/employees/models/Employee';

export class AttendanceController {
  async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }
      const organizationId = context.organizationId.toString();
      const userId = context.userId.toString();

      const employeeId = req.body['employeeId'] as string;
      const checkInTime = req.body['checkInTime']
        ? new Date(req.body['checkInTime'] as string)
        : new Date();

      if (!employeeId) {
        throw new AppError('Employee ID is required', 400, 'VALIDATION_ERROR');
      }

      const canManageOthers = ['super_admin', 'hr_admin'].includes(context.userRole);

      // Only super_admin/hr_admin may act on others; everyone else must act on their own profile
      if (!canManageOthers) {
        const emp = await EmployeeModel.findOne({
          _id: new Types.ObjectId(employeeId),
          organizationId: new Types.ObjectId(organizationId),
          userId: new Types.ObjectId(userId),
          isDeleted: { $ne: true },
        });

        if (!emp) {
          throw new AppError('Insufficient permissions: can only check in for your own profile', 403, 'INSUFFICIENT_PERMISSIONS');
        }
      }

      const record = await attendanceService.checkIn(
        employeeId,
        organizationId,
        checkInTime,
        userId,
        context.requestId
      );

      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }
      const organizationId = context.organizationId.toString();
      const userId = context.userId.toString();

      const employeeId = req.body['employeeId'] as string;
      const checkOutTime = req.body['checkOutTime']
        ? new Date(req.body['checkOutTime'] as string)
        : new Date();
      const breakMinutes = req.body['breakMinutes']
        ? Number(req.body['breakMinutes'])
        : 0;

      if (!employeeId) {
        throw new AppError('Employee ID is required', 400, 'VALIDATION_ERROR');
      }

      const canManageOthers = ['super_admin', 'hr_admin'].includes(context.userRole);

      // Only super_admin/hr_admin may act on others; everyone else must act on their own profile
      if (!canManageOthers) {
        const emp = await EmployeeModel.findOne({
          _id: new Types.ObjectId(employeeId),
          organizationId: new Types.ObjectId(organizationId),
          userId: new Types.ObjectId(userId),
          isDeleted: { $ne: true },
        });
        if (!emp) {
          throw new AppError('Insufficient permissions: can only check out for your own profile', 403, 'INSUFFICIENT_PERMISSIONS');
        }
      }

      const record = await attendanceService.checkOut(
        employeeId,
        organizationId,
        checkOutTime,
        userId,
        context.requestId,
        breakMinutes
      );

      res.json(record);
    } catch (error) {
      next(error);
    }
  }

  async getByDate(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }
      const organizationId = context.organizationId.toString();

      const employeeId = req.params['employeeId'];
      const date = req.query['date']
        ? new Date(req.query['date'] as string)
        : new Date();

      if (!employeeId) {
        throw new AppError('Employee ID is required', 400, 'VALIDATION_ERROR');
      }

      const record = await attendanceService.getAttendanceByDate(
        employeeId,
        organizationId,
        date
      );

      if (!record) {
        throw new AppError('Attendance record not found', 404, 'NOT_FOUND');
      }

      res.json(record);
    } catch (error) {
      next(error);
    }
  }

  async getMonthly(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }
      const organizationId = context.organizationId.toString();
      const userId = context.userId.toString();

      const employeeId = req.params['employeeId'];
      const year = req.query['year']
        ? parseInt(req.query['year'] as string, 10)
        : new Date().getFullYear();
      const month = req.query['month']
        ? parseInt(req.query['month'] as string, 10)
        : new Date().getMonth() + 1;

      if (!employeeId) {
        throw new AppError('Employee ID is required', 400, 'VALIDATION_ERROR');
      }

      // Employees can only view their own monthly summary
      if (context.userRole === 'employee') {
        const emp = await EmployeeModel.findOne({
          _id: new Types.ObjectId(employeeId),
          organizationId: new Types.ObjectId(organizationId),
          userId: new Types.ObjectId(userId),
          isDeleted: { $ne: true },
        });
        if (!emp) {
          throw new AppError('Insufficient permissions: can only view your own attendance', 403, 'INSUFFICIENT_PERMISSIONS');
        }
      }

      const result = await attendanceService.getMonthlyAttendance(
        employeeId,
        organizationId,
        year,
        month
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async markAbsent(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }
      const organizationId = context.organizationId.toString();
      const userId = context.userId.toString();

      const employeeId = req.body['employeeId'] as string;
      const date = req.body['date']
        ? new Date(req.body['date'] as string)
        : new Date();
      const notes = req.body['notes'] as string | undefined;

      if (!employeeId) {
        throw new AppError('Employee ID is required', 400, 'VALIDATION_ERROR');
      }

      const record = await attendanceService.markAbsent(
        employeeId,
        organizationId,
        date,
        userId,
        context.requestId,
        notes
      );

      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  }

  async upsertPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }
      const organizationId = context.organizationId.toString();
      const userId = context.userId.toString();

      const policy = await attendanceService.upsertPolicy(
        organizationId,
        req.body,
        userId,
        context.requestId
      );

      res.status(201).json(policy);
    } catch (error) {
      next(error);
    }
  }
}

export const attendanceController = new AttendanceController();
