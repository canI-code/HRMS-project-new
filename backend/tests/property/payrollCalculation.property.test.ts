import fc from 'fast-check';
import { payrollService } from '../../src/domains/payroll/services/PayrollService';
import { ISalaryStructure } from '../../src/domains/payroll/models/SalaryStructure';
import { SalaryStructureModel } from '../../src/domains/payroll/models/SalaryStructure';
import { PayrollRunModel } from '../../src/domains/payroll/models/PayrollRun';
import { PayslipModel } from '../../src/domains/payroll/models/Payslip';
import { Types } from 'mongoose';
import { AppError } from '../../src/shared/utils/AppError';

jest.mock('@/domains/payroll/models/SalaryStructure');
jest.mock('@/domains/payroll/models/PayrollRun');
jest.mock('@/domains/payroll/models/Payslip');

const roundHalfUp = (value: number) => {
  const abs = Math.abs(value);
  const rounded = Math.round(abs);
  return value < 0 ? -rounded : rounded;
};

describe('Payroll calculation properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Property 21: arithmetic correctness with caps and net rounding only at final step', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50_000, max: 500_000 }), // base salary in minor units
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 12 }),
            code: fc.string({ minLength: 3, maxLength: 6 }),
            value: fc.integer({ min: 1, max: 30 }),
            capAmount: fc.option(fc.integer({ min: 20_000, max: 200_000 })),
            applyOnBaseOnly: fc.boolean(),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 12 }),
            code: fc.string({ minLength: 3, maxLength: 6 }),
            value: fc.integer({ min: 1, max: 30 }),
            capAmount: fc.option(fc.integer({ min: 10_000, max: 150_000 })),
            applyOnBaseOnly: fc.boolean(),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (baseSalary, earnings, deductions) => {
          const structure: ISalaryStructure = {
            _id: new Types.ObjectId(),
            organizationId: new Types.ObjectId(),
            name: 'Test',
            version: 1,
            effectiveFrom: new Date(),
            effectiveTo: null,
            isActive: true,
            components: [
              ...earnings.map((e) => ({
                ...e,
                type: 'earning' as const,
                calculationType: 'percentage' as const,
              })),
              ...deductions.map((d) => ({
                ...d,
                type: 'deduction' as const,
                calculationType: 'percentage' as const,
              })),
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          } as ISalaryStructure;

          let expectedGross = baseSalary;
          let expectedDeductions = 0;

          for (const component of structure.components) {
            const target = component.applyOnBaseOnly === false ? expectedGross : baseSalary;
            let amount = (target * component.value) / 100;
            if (component.capAmount !== undefined && component.capAmount !== null) {
              amount = Math.min(amount, component.capAmount);
            }
            if (component.type === 'earning') {
              expectedGross += amount;
            } else {
              expectedDeductions += amount;
            }
          }

          if (expectedDeductions > expectedGross) {
            await expect(() => payrollService.computePayslip(structure, baseSalary)).toThrow(AppError);
            return;
          }

          const result = payrollService.computePayslip(structure, baseSalary);

          expect(result.gross).toBeCloseTo(expectedGross, 5);
          expect(result.deductions).toBeCloseTo(expectedDeductions, 5);
          expect(result.net).toBeCloseTo(expectedGross - expectedDeductions, 5);
          expect(result.netRounded).toBe(roundHalfUp(result.net));
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 23: latest salary structure version is used and run is locked on completion', async () => {
    const orgId = new Types.ObjectId().toString();
    const structureV2: any = { _id: new Types.ObjectId(), organizationId: orgId, version: 2, components: [], effectiveFrom: new Date(), isActive: true };

    (SalaryStructureModel.findOne as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue(structureV2) });

    const runDoc: any = {
      _id: new Types.ObjectId(),
      organizationId: orgId,
      salaryStructureId: structureV2._id,
      structureVersion: structureV2.version,
      periodStart: new Date(),
      periodEnd: new Date(),
      status: 'pending',
      locked: false,
      totals: { gross: 0, deductions: 0, net: 0 },
      save: jest.fn().mockResolvedValue(true),
    };

    (PayrollRunModel.create as jest.Mock).mockResolvedValue(runDoc);
    (PayslipModel.insertMany as jest.Mock).mockResolvedValue([]);

    await payrollService.startPayrollRun(
      orgId,
      new Date('2024-01-01'),
      new Date('2024-01-31'),
      [{ employeeId: new Types.ObjectId().toString(), baseSalaryMinor: 100_000 }],
      new Types.ObjectId().toString(),
      'req-1'
    );

    expect(runDoc.structureVersion).toBe(2);
    expect(runDoc.status).toBe('completed');
    expect(runDoc.locked).toBe(true);
    expect(PayslipModel.insertMany).toHaveBeenCalledTimes(1);
  });

  test('Property: deductions exceeding gross fail the run and do not persist payslips', async () => {
    const orgId = new Types.ObjectId().toString();
    const structure: any = {
      _id: new Types.ObjectId(),
      organizationId: orgId,
      version: 1,
      effectiveFrom: new Date(),
      components: [
        { name: 'Huge Deduction', code: 'HD', type: 'deduction', calculationType: 'fixed', value: 200_000 },
      ],
      isActive: true,
    };

    (SalaryStructureModel.findOne as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue(structure) });

    const runDoc: any = {
      _id: new Types.ObjectId(),
      organizationId: orgId,
      salaryStructureId: structure._id,
      structureVersion: structure.version,
      periodStart: new Date(),
      periodEnd: new Date(),
      status: 'pending',
      locked: false,
      totals: { gross: 0, deductions: 0, net: 0 },
      save: jest.fn().mockResolvedValue(true),
    };

    (PayrollRunModel.create as jest.Mock).mockResolvedValue(runDoc);
    (PayslipModel.insertMany as jest.Mock).mockResolvedValue([]);

    await expect(
      payrollService.startPayrollRun(
        orgId,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        [{ employeeId: new Types.ObjectId().toString(), baseSalaryMinor: 100_000 }],
        new Types.ObjectId().toString(),
        'req-err'
      )
    ).rejects.toBeInstanceOf(AppError);

    expect(runDoc.status).toBe('failed');
    expect(runDoc.locked).toBe(true);
    expect(PayslipModel.insertMany).not.toHaveBeenCalled();
  });
});
