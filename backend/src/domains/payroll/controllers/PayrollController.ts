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
      if (!periodStart || !periodEnd) {
        throw new AppError('Period start and end dates are required', 400, 'VALIDATION_ERROR');
      }

      // If employees array is not provided, backend will fetch all employees with active salary structures
      const employeesArray = employees && Array.isArray(employees) && employees.length > 0 
        ? employees 
        : [];

      const run = await payrollService.startPayrollRun(
        context.organizationId.toString(),
        new Date(periodStart),
        new Date(periodEnd),
        employeesArray,
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

  async listMyPayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      // Find the employee record for the current user
      const { EmployeeModel } = await import('@/domains/employees/models/Employee');
      const employee = await EmployeeModel.findOne({ 
        userId: context.userId, 
        organizationId: context.organizationId 
      });

      if (!employee) {
        throw new AppError('Employee record not found', 404, 'EMPLOYEE_NOT_FOUND');
      }

      const payslips = await payrollService.listPayslipsForEmployee(
        employee._id.toString(), 
        context.organizationId.toString()
      );
      res.json(payslips);
    } catch (error) {
      next(error);
    }
  }

  async getMyPayslip(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const payslipId = req.params['payslipId'];
      if (!payslipId) {
        throw new AppError('Payslip ID is required', 400, 'VALIDATION_ERROR');
      }

      // Find the employee record for the current user
      const { EmployeeModel } = await import('@/domains/employees/models/Employee');
      const employee = await EmployeeModel.findOne({ 
        userId: context.userId, 
        organizationId: context.organizationId 
      });

      if (!employee) {
        throw new AppError('Employee record not found', 404, 'EMPLOYEE_NOT_FOUND');
      }

      // Get the payslip and verify it belongs to this employee
      const payslip = await payrollService.getPayslip(payslipId, context.organizationId.toString());
      if (!payslip) {
        throw new AppError('Payslip not found', 404, 'NOT_FOUND');
      }

      // Security check: ensure payslip belongs to the requesting employee
      const payslipEmployeeId = payslip.employeeId instanceof require('mongoose').Types.ObjectId 
        ? payslip.employeeId.toString() 
        : (payslip.employeeId._id ? payslip.employeeId._id.toString() : payslip.employeeId.toString());
      
      const currentEmployeeId = employee._id.toString();
      
      if (payslipEmployeeId !== currentEmployeeId) {
        throw new AppError(`Access denied: You can only view your own payslips. Expected: ${currentEmployeeId}, Got: ${payslipEmployeeId}`, 403, 'FORBIDDEN');
      }

      res.json(payslip);
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

  async assignSalary(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const { employeeId, salaryStructureId, baseSalary, effectiveFrom, remarks } = req.body;
      if (!employeeId || !salaryStructureId || !baseSalary) {
        throw new AppError('Employee ID, salary structure ID, and base salary are required', 400, 'VALIDATION_ERROR');
      }

      const salary = await payrollService.assignSalaryToEmployee(
        context.organizationId.toString(),
        employeeId,
        salaryStructureId,
        baseSalary,
        effectiveFrom ? new Date(effectiveFrom) : new Date(),
        context.userId.toString(),
        remarks
      );

      res.status(201).json(salary);
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeSalary(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const employeeId = req.params['employeeId'];
      if (!employeeId) {
        throw new AppError('Employee ID is required', 400, 'VALIDATION_ERROR');
      }

      const salary = await payrollService.getActiveEmployeeSalary(
        context.organizationId.toString(),
        employeeId
      );

      if (!salary) {
        throw new AppError('No active salary found for employee', 404, 'NOT_FOUND');
      }

      res.json(salary);
    } catch (error) {
      next(error);
    }
  }

  async listEmployeesWithSalary(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const employees = await payrollService.listEmployeesWithSalary(context.organizationId.toString());
      res.json(employees);
    } catch (error) {
      next(error);
    }
  }
}

export const payrollController = new PayrollController();
