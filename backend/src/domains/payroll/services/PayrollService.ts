import { Types } from 'mongoose';
import { SalaryStructureModel, ISalaryStructure, IStructureComponent } from '../models/SalaryStructure';
import { PayrollRunModel, IPayrollRun, PayrollRunStatus } from '../models/PayrollRun';
import { PayslipModel, IPayslip, IPayslipComponent } from '../models/Payslip';
import { AppError } from '@/shared/utils/AppError';
import { auditLogStore } from '@/shared/middleware/auditLogger';
import { AuditAction } from '@/shared/types/common';

export interface PayrollEmployeeInput {
  employeeId: string;
  baseSalaryMinor: number; // integer or fractional minor units
}

export interface PayslipComputationResult {
  baseSalary: number;
  gross: number;
  deductions: number;
  net: number;
  netRounded: number;
  components: IPayslipComponent[];
}

const roundHalfUpToMinorUnit = (value: number): number => {
  const abs = Math.abs(value);
  const rounded = Math.round(abs); // Math.round is half-up for positive values
  return value < 0 ? -rounded : rounded;
};

const computeComponentAmount = (
  component: IStructureComponent,
  baseSalary: number,
  currentGross: number
): number => {
  if (component.calculationType === 'fixed') {
    return component.value;
  }

  const target = component.applyOnBaseOnly === false ? currentGross : baseSalary;
  const computed = (target * component.value) / 100;
  if (component.capAmount !== undefined && component.capAmount !== null) {
    return Math.min(computed, component.capAmount);
  }
  return computed;
};

class PayrollService {
  async createSalaryStructure(
    organizationId: string,
    payload: Pick<ISalaryStructure, 'name' | 'components' | 'effectiveFrom' | 'effectiveTo'>,
    userId: string,
    requestId: string
  ): Promise<ISalaryStructure> {
    const latest = await SalaryStructureModel.findOne({ organizationId }).sort({ version: -1 });
    const version = latest ? latest.version + 1 : 1;

    const structure = await SalaryStructureModel.create({
      ...payload,
      organizationId: new Types.ObjectId(organizationId),
      version,
      isActive: true,
    });

    await auditLogStore.add({
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(organizationId),
      action: AuditAction.CREATE,
      resource: 'salary-structure',
      resourceId: new Types.ObjectId(structure._id.toString()),
      changes: { after: { version } },
      success: true,
      metadata: {
        ipAddress: 'internal',
        userAgent: 'payroll-service',
        requestId,
        timestamp: new Date(),
        method: 'POST',
        url: '/api/payroll/structures',
      },
    });

    return structure;
  }

  private async getActiveStructure(organizationId: string): Promise<ISalaryStructure> {
    const structure = await SalaryStructureModel.findOne({ organizationId }).sort({ version: -1 });
    if (!structure) {
      throw new AppError('No salary structure found for organization', 404, 'NO_STRUCTURE');
    }
    return structure;
  }

  async getActiveStructurePublic(organizationId: string): Promise<ISalaryStructure> {
    return this.getActiveStructure(organizationId);
  }

  computePayslip(
    structure: ISalaryStructure,
    baseSalary: number
    ): PayslipComputationResult {
    let gross = baseSalary;
    let deductions = 0;
    const components: IPayslipComponent[] = [];

    for (const component of structure.components) {
      const amount = computeComponentAmount(component, baseSalary, gross);
      const entry: IPayslipComponent = {
        name: component.name,
        code: component.code,
        amount,
        type: component.type,
      };
      components.push(entry);
      if (component.type === 'earning') {
        gross += amount;
      } else {
        deductions += amount;
      }
    }

    if (deductions > gross) {
      throw new AppError('Deductions exceed gross salary', 400, 'EXCESS_DEDUCTIONS');
    }

    const net = gross - deductions;
    const netRounded = roundHalfUpToMinorUnit(net);

    return {
      baseSalary,
      gross,
      deductions,
      net,
      netRounded,
      components,
    };
  }

  async startPayrollRun(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
    employees: PayrollEmployeeInput[],
    userId: string,
    requestId: string
  ): Promise<IPayrollRun> {
    const structure = await this.getActiveStructure(organizationId);

    const run = await PayrollRunModel.create({
      organizationId: new Types.ObjectId(organizationId),
      salaryStructureId: new Types.ObjectId(structure._id.toString()),
      structureVersion: structure.version,
      periodStart,
      periodEnd,
      status: 'pending' as PayrollRunStatus,
      locked: false,
      createdBy: new Types.ObjectId(userId),
      totals: { gross: 0, deductions: 0, net: 0 },
    });

    run.status = 'processing';
    await run.save();

    const payslipsToInsert: IPayslip[] = [] as any;
    let grossTotal = 0;
    let deductionTotal = 0;
    let netTotalRounded = 0;

    try {
      for (const emp of employees) {
        const computed = this.computePayslip(structure, emp.baseSalaryMinor);
        grossTotal += computed.gross;
        deductionTotal += computed.deductions;
        netTotalRounded += computed.netRounded;

        payslipsToInsert.push({
          organizationId: new Types.ObjectId(organizationId),
          payrollRunId: new Types.ObjectId(run._id.toString()),
          salaryStructureId: new Types.ObjectId(structure._id.toString()),
          structureVersion: structure.version,
          employeeId: new Types.ObjectId(emp.employeeId),
          baseSalary: computed.baseSalary,
          gross: computed.gross,
          deductions: computed.deductions,
          net: computed.net,
          netRounded: computed.netRounded,
          components: computed.components,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }

      // Insert payslips only if all computations succeed
      await PayslipModel.insertMany(payslipsToInsert);

      run.totals = {
        gross: grossTotal,
        deductions: deductionTotal,
        net: netTotalRounded,
      };
      run.status = 'completed';
      run.locked = true;
      run.completedAt = new Date();
      await run.save();

      await auditLogStore.add({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        organizationId: new Types.ObjectId(organizationId),
        action: AuditAction.CREATE,
        resource: 'payroll-run',
        resourceId: new Types.ObjectId(run._id.toString()),
        changes: { after: { status: 'completed', structureVersion: structure.version } },
        success: true,
        metadata: {
          ipAddress: 'internal',
          userAgent: 'payroll-service',
          requestId,
          timestamp: new Date(),
          method: 'POST',
          url: '/api/payroll/runs',
        },
      });

      return run;
    } catch (error) {
      run.status = 'failed';
      run.locked = true;
      run.failedAt = new Date();
      run.failureReason = (error as Error).message;
      await run.save();

      await auditLogStore.add({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        organizationId: new Types.ObjectId(organizationId),
        action: AuditAction.UPDATE,
        resource: 'payroll-run',
        resourceId: new Types.ObjectId(run._id.toString()),
        changes: { after: { status: 'failed', reason: run.failureReason } },
        success: false,
        metadata: {
          ipAddress: 'internal',
          userAgent: 'payroll-service',
          requestId,
          timestamp: new Date(),
          method: 'POST',
          url: '/api/payroll/runs',
        },
      });

      // Do not persist any payslips on failure (insertMany not called or would have thrown)
      throw error;
    }
  }

  async getRun(runId: string, organizationId: string): Promise<IPayrollRun | null> {
    return PayrollRunModel.findOne({ _id: runId, organizationId });
  }

  async listPayslips(runId: string, organizationId: string): Promise<IPayslip[]> {
    return PayslipModel.find({ payrollRunId: runId, organizationId });
  }

  async getPayslip(payslipId: string, organizationId: string): Promise<IPayslip | null> {
    return PayslipModel.findOne({ _id: payslipId, organizationId });
  }
}

export const payrollService = new PayrollService();
