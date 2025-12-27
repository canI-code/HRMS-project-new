import * as fc from 'fast-check';
import { Types } from 'mongoose';
import { Organization } from '@/domains/auth/models/Organization';
import { EmployeeService } from '@/domains/employees/services/EmployeeService';
import { EmployeeModel } from '@/domains/employees/models/Employee';
import { auditLogStore } from '@/shared/middleware/auditLogger';

/**
 * Property 7: Audit trail maintenance
 * Validates: Requirements 2.2
 */
describe('Employee Audit Property Tests', () => {
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
        name: 'Employee Audit Org',
        displayName: 'Emp Audit Org',
        domain: 'employees-audit',
        country: 'US',
        currency: 'USD',
        timezone: 'UTC',
        contactInfo: { email: 'audit@test.com' },
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

  it('should record immutable audit logs on create and update', async () => {
    if (process.env['SKIP_DB_TESTS'] === 'true') return;

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          employeeCode: fc.hexaString({ minLength: 6, maxLength: 12 }),
          firstName: fc.stringMatching(/^[A-Za-z][A-Za-z ]{1,19}$/),
          lastName: fc.stringMatching(/^[A-Za-z][A-Za-z ]{1,19}$/),
          email: fc.emailAddress(),
          department: fc.string({ minLength: 2, maxLength: 20 }),
          title: fc.string({ minLength: 2, maxLength: 30 }),
          newTitle: fc.string({ minLength: 2, maxLength: 30 }),
        }),
        async (rec) => {
          const ctx = { ...ctxBase, organizationId: orgId };
          const emp = await EmployeeService.createEmployee(ctx, {
            organizationId: orgId,
            employeeCode: rec.employeeCode,
            personal: { firstName: rec.firstName, lastName: rec.lastName, contact: { email: rec.email } },
            professional: { department: rec.department, title: rec.title, employmentType: 'full_time', startDate: new Date() },
          });

          // Validate audit log existence and immutability
          const createLogs = auditLogStore.getByResource('employees', emp._id);
          expect(createLogs.length).toBeGreaterThan(0);
          const log = createLogs[0]!;
          expect(log.action).toBe('CREATE');
          // Try to mutate returned log
          const originalSuccess = log.success;
          (log as any).success = !originalSuccess;
          const recheck = auditLogStore.getByResource('employees', emp._id)[0]!;
          expect(recheck.success).toBe(originalSuccess);

          // Update
          const updated = await EmployeeService.updateEmployee(ctx, emp._id, { professional: { title: rec.newTitle } });
          expect(updated.professional.title).toBe(rec.newTitle);
          const updateLogs = auditLogStore.getByResource('employees', emp._id);
          expect(updateLogs.length).toBeGreaterThan(1);

          // Cleanup
          await EmployeeModel.findByIdAndDelete(emp._id);
        }
      ),
      { numRuns: 5 }
    );
  });
});
