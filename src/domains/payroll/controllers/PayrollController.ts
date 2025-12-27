import { Request, Response, NextFunction } from 'express';
import { payrollService } from '../services/PayrollService';
import { AppError } from '@/shared/utils/AppError';

export class PayrollController {
  async createStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const { name, components, effectiveFrom, effectiveTo } = req.body;
      if (!name || !components || !Array.isArray(components) || components.length === 0) {
        throw new AppError('Invalid salary structure payload', 400, 'VALIDATION_ERROR');
      }

      const structure = await payrollService.createSalaryStructure(
        context.organizationId.toString(),
        {
          name,
          components,
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
          effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
          isActive: true,
        } as any,
        context.userId.toString(),
        context.requestId
      );

      res.status(201).json(structure);
    } catch (error) {
      next(error);
    }
  }

  async getActiveStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const structure = await payrollService.getActiveStructurePublic(context.organizationId.toString());
      res.json(structure);
    } catch (error) {
      next(error);
    }
  }

  async startRun(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const { periodStart, periodEnd, employees } = req.body;
      if (!periodStart || !periodEnd || !Array.isArray(employees) || employees.length === 0) {
        throw new AppError('Invalid payroll run payload', 400, 'VALIDATION_ERROR');
      }

      const run = await payrollService.startPayrollRun(
        context.organizationId.toString(),
        new Date(periodStart),
        new Date(periodEnd),
        employees,
        context.userId.toString(),
        context.requestId
      );

      res.status(201).json(run);
    } catch (error) {
      next(error);
    }
  }

  async getRun(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }
      const runId = req.params['runId'];
      if (!runId) {
        throw new AppError('Run ID is required', 400, 'VALIDATION_ERROR');
      }
      const run = await payrollService.getRun(runId, context.organizationId.toString());
      if (!run) {
        throw new AppError('Payroll run not found', 404, 'NOT_FOUND');
      }
      res.json(run);
    } catch (error) {
      next(error);
    }
  }

  async listPayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }
      const runId = req.params['runId'];
      if (!runId) {
        throw new AppError('Run ID is required', 400, 'VALIDATION_ERROR');
      }
      const payslips = await payrollService.listPayslips(runId, context.organizationId.toString());
      res.json(payslips);
    } catch (error) {
      next(error);
    }
  }

  async getPayslip(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }
      const payslipId = req.params['payslipId'];
      if (!payslipId) {
        throw new AppError('Payslip ID is required', 400, 'VALIDATION_ERROR');
      }
      const payslip = await payrollService.getPayslip(payslipId, context.organizationId.toString());
      if (!payslip) {
        throw new AppError('Payslip not found', 404, 'NOT_FOUND');
      }
      res.json(payslip);
    } catch (error) {
      next(error);
    }
  }
}

export const payrollController = new PayrollController();
