import * as fc from 'fast-check';
import { Types } from 'mongoose';
import { Organization } from '@/domains/auth/models/Organization';
import { EmployeeService } from '@/domains/employees/services/EmployeeService';
import { EmployeeModel } from '@/domains/employees/models/Employee';

/**
 * Property 8: Hierarchy and permission consistency
 * Validates: Requirements 2.3
 */
describe('Hierarchy Consistency Property Tests', () => {
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
        name: 'Hierarchy Org',
        displayName: 'Hierarchy',
        domain: 'employees-hierarchy',
        country: 'US',
        currency: 'USD',
        timezone: 'UTC',
        contactInfo: { email: 'hier@test.com' },
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

  afterAll(async () => {
    if (process.env['SKIP_DB_TESTS'] !== 'true') {
      await EmployeeModel.deleteMany({ organizationId: orgId });
      await Organization.findByIdAndDelete(orgId);
    }
  });

  it('should update both sides when setting manager and prevent self/circular management', async () => {
    if (process.env['SKIP_DB_TESTS'] === 'true') return;

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          managerCode: fc.hexaString({ minLength: 6, maxLength: 12 }),
          employeeCode: fc.hexaString({ minLength: 6, maxLength: 12 }),
          firstName: fc.string({ minLength: 2, maxLength: 20 }),
          lastName: fc.string({ minLength: 2, maxLength: 20 }),
          email: fc.emailAddress(),
        }),
        async (rec) => {
          const ctx = { ...ctxBase, organizationId: orgId };
          const manager = await EmployeeService.createEmployee(ctx, {
            organizationId: orgId,
            employeeCode: rec.managerCode,
            personal: { firstName: rec.firstName, lastName: rec.lastName, contact: { email: rec.email } },
            professional: { employmentType: 'full_time', startDate: new Date(), title: 'Manager' },
          });
          const emp = await EmployeeService.createEmployee(ctx, {
            organizationId: orgId,
            employeeCode: rec.employeeCode,
            personal: { firstName: rec.firstName, lastName: rec.lastName, contact: { email: rec.email } },
            professional: { employmentType: 'full_time', startDate: new Date(), title: 'Engineer' },
          });

          // Prevent self manager
          let selfError = false;
          try {
            await EmployeeService.setManager(ctx, manager._id, manager._id);
          } catch {
            selfError = true;
          }
          expect(selfError).toBe(true);

          // Set manager properly
          const result = await EmployeeService.setManager(ctx, emp._id, manager._id);
          expect(result.employee.professional.managerId!.toString()).toBe(manager._id.toString());
          expect(result.manager.reporting!.directReportIds!.map(id => id.toString())).toContain(emp._id.toString());

          // Prevent circular
          let circularError = false;
          try {
            await EmployeeService.setManager(ctx, manager._id, emp._id);
          } catch {
            circularError = true;
          }
          expect(circularError).toBe(true);

          // Cleanup
          await EmployeeModel.findByIdAndDelete(manager._id);
          await EmployeeModel.findByIdAndDelete(emp._id);
        }
      ),
      { numRuns: 5 }
    );
  });
});
