import * as fc from 'fast-check';
import { Types } from 'mongoose';
import { Organization } from '@/domains/auth/models/Organization';
import { EmployeeService } from '@/domains/employees/services/EmployeeService';
import { EmployeeModel } from '@/domains/employees/models/Employee';

/**
 * Property 6: Complete employee profile creation
 * Validates: Requirements 2.1
 */
describe('Employee Profile Property Tests', () => {
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
        name: 'Employee Domain Org',
        displayName: 'Emp Org',
        domain: 'employees',
        country: 'US',
        currency: 'USD',
        timezone: 'UTC',
        contactInfo: { email: 'emp@test.com' },
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

  it('should create complete employee profiles with unique employeeCode', async () => {
    if (process.env['SKIP_DB_TESTS'] === 'true') return;

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            employeeCode: fc.hexaString({ minLength: 6, maxLength: 12 }),
            firstName: fc.string({ minLength: 2, maxLength: 20 }),
            lastName: fc.string({ minLength: 2, maxLength: 20 }),
            email: fc.emailAddress(),
            department: fc.string({ minLength: 2, maxLength: 20 }),
            title: fc.string({ minLength: 2, maxLength: 30 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (arr) => {
          const createdIds: Types.ObjectId[] = [];
          for (const rec of arr) {
            const ctx = { ...ctxBase, organizationId: orgId };
            const emp = await EmployeeService.createEmployee(ctx, {
              organizationId: orgId,
              employeeCode: rec.employeeCode,
              personal: {
                firstName: rec.firstName,
                lastName: rec.lastName,
                contact: { email: rec.email },
              },
              professional: {
                department: rec.department,
                title: rec.title,
                employmentType: 'full_time',
                startDate: new Date(),
              },
            });
            // Validate core fields
            expect(emp.personal.firstName).toBeTruthy();
            expect(emp.personal.lastName).toBeTruthy();
            expect(emp.personal.contact.email).toBeTruthy();
            expect(emp.professional.employmentType).toBe('full_time');
            expect(emp.professional.startDate).toBeInstanceOf(Date);

            createdIds.push(emp._id);
          }

          // Ensure uniqueness by fetching and comparing codes
          const employees = await EmployeeModel.find({ _id: { $in: createdIds } });
          const codes = employees.map(e => e.employeeCode);
          expect(new Set(codes).size).toBe(codes.length);

          // Cleanup
          await EmployeeModel.deleteMany({ _id: { $in: createdIds } });
        }
      ),
      { numRuns: 5 }
    );
  });
});
