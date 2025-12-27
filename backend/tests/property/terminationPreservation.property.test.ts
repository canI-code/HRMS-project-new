import * as fc from 'fast-check';
import { Types } from 'mongoose';
import { Organization } from '@/domains/auth/models/Organization';
import { EmployeeService } from '@/domains/employees/services/EmployeeService';
import { EmployeeModel, EmployeeStatus } from '@/domains/employees/models/Employee';
import { auditLogStore } from '@/shared/middleware/auditLogger';

/**
 * Property 9: Employee termination data preservation
 * Validates: Requirements 2.4
 */
describe('Employee Termination Property Tests', () => {
  let orgId: Types.ObjectId;
  const ctxBase = {
    userId: new Types.ObjectId(),
    organizationId: new Types.ObjectId(),
    userRole: 'hr_admin' as any,
    requestId: 'test-request-id',
    ipAddress: '127.0.0.1',
    userAgent: 'tests',
  };

  beforeAll(async () => {
    if (process.env['SKIP_DB_TESTS'] !== 'true') {
      const org = await Organization.create({
        name: 'Termination Org',
        displayName: 'Term Org',
        domain: 'employees-termination',
        country: 'US',
        currency: 'USD',
        timezone: 'UTC',
        contactInfo: { email: 'term@test.com' },
        subscription: { plan: 'professional', status: 'active', startDate: new Date(), maxEmployees: 100, maxUsers: 50 },
        settings: {
          workWeek: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
          workingHours: { start: '09:00', end: '17:00' },
          leavePolicies: { allowNegativeBalance: false, requireManagerApproval: true, autoApprovalThreshold: 0, carryForwardLimit: 5 },
          attendancePolicies: { lateArrivalGracePeriod: 15, earlyDepartureGracePeriod: 15, overtimeEnabled: true, overtimeMultiplier: 1.5 },
          payrollSettings: { payrollCycle: 'monthly', payrollDay: 1, taxCalculationEnabled: true },
          securitySettings: { passwordMinLength: 8, passwordRequireUppercase: true, passwordRequireLowercase: true, passwordRequireNumbers: true, passwordRequireSpecialChars: false, passwordExpiryDays: 90, mfaRequired: false, sessionTimeoutMinutes: 60, ipWhitelist: [] },
        },
      });
      orgId = org._id;
    }
  });

  afterEach(() => {
    auditLogStore.clear();
  });

  afterAll(async () => {
    if (process.env['SKIP_DB_TESTS'] !== 'true') {
      await EmployeeModel.deleteMany({ organizationId: orgId });
      await Organization.findByIdAndDelete(orgId);
    }
  });

  it('should preserve employee data and require end date on termination', async () => {
    if (process.env['SKIP_DB_TESTS'] === 'true') return;

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          employeeCode: fc.hexaString({ minLength: 6, maxLength: 12 }),
          firstName: fc.stringMatching(/^[A-Za-z][A-Za-z ]{1,19}$/),
          lastName: fc.stringMatching(/^[A-Za-z][A-Za-z ]{1,19}$/),
          email: fc.emailAddress(),
          baseSalary: fc.integer({ min: 0, max: 100000 }),
          benefitCount: fc.integer({ min: 0, max: 5 }),
        }),
        async (rec) => {
          const ctx = { ...ctxBase, organizationId: orgId };
          const emp = await EmployeeService.createEmployee(ctx, {
            organizationId: orgId,
            employeeCode: rec.employeeCode,
            personal: { firstName: rec.firstName, lastName: rec.lastName, contact: { email: rec.email } },
            professional: { employmentType: 'full_time', startDate: new Date(), title: 'Engineer' },
            payroll: { baseSalary: rec.baseSalary, benefits: Array(rec.benefitCount).fill('Benefit') },
            documents: [{ documentId: new Types.ObjectId(), type: 'OFFER_LETTER' }],
          });

          const endDate = new Date();
          const terminated = await EmployeeService.terminateEmployee(ctx, emp._id, endDate, 'Project closed');
          expect(terminated.professional.status).toBe(EmployeeStatus.TERMINATED);
          expect(terminated.professional.endDate!.getTime()).toBe(endDate.getTime());
          expect(terminated.documents!.length).toBe(1);
          expect(terminated.payroll!.baseSalary).toBe(rec.baseSalary);

          const logs = auditLogStore.getByResource('employees', emp._id);
          expect(logs.some(l => l.action === 'DELETE')).toBe(true);

          // Cleanup
          await EmployeeModel.findByIdAndDelete(emp._id);
        }
      ),
      { numRuns: 5 }
    );
  });
});
