import * as fc from 'fast-check';
import { AuthService } from '@/domains/auth/services/AuthService';
import { User } from '@/domains/auth/models/User';
import { Organization } from '@/domains/auth/models/Organization';
import { Types } from 'mongoose';
import speakeasy from 'speakeasy';

/**
 * **Feature: enterprise-hrms, Property 4: MFA enforcement consistency**
 * **Validates: Requirements 1.4**
 */
describe('MFA Enforcement Property Tests', () => {
  let testOrgId: Types.ObjectId;

  beforeAll(async () => {
    if (process.env['SKIP_DB_TESTS'] !== 'true') {
      const org = await Organization.create({
        name: 'Test Organization MFA',
        displayName: 'Test Org MFA',
        domain: 'test-mfa-enforcement',
        country: 'US',
        currency: 'USD',
        timezone: 'UTC',
        contactInfo: {
          email: 'test-mfa@test.com',
        },
        subscription: {
          plan: 'enterprise',
          status: 'active',
          startDate: new Date(),
          maxEmployees: 100,
          maxUsers: 50,
        },
        settings: {
          workWeek: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: false,
          },
          workingHours: {
            start: '09:00',
            end: '17:00',
          },
          leavePolicies: {
            allowNegativeBalance: false,
            requireManagerApproval: true,
            autoApprovalThreshold: 0,
            carryForwardLimit: 5,
          },
          attendancePolicies: {
            lateArrivalGracePeriod: 15,
            earlyDepartureGracePeriod: 15,
            overtimeEnabled: true,
            overtimeMultiplier: 1.5,
          },
          payrollSettings: {
            payrollCycle: 'monthly',
            payrollDay: 1,
            taxCalculationEnabled: true,
          },
          securitySettings: {
            passwordMinLength: 8,
            passwordRequireUppercase: true,
            passwordRequireLowercase: true,
            passwordRequireNumbers: true,
            passwordRequireSpecialChars: false,
            passwordExpiryDays: 90,
            mfaRequired: false, // Will be toggled in tests
            sessionTimeoutMinutes: 60,
            ipWhitelist: [],
          },
        },
      });
      testOrgId = org._id;
    }
  });

  afterAll(async () => {
    if (process.env['SKIP_DB_TESTS'] !== 'true') {
      await User.deleteMany({ organizationId: testOrgId });
      await Organization.findByIdAndDelete(testOrgId);
    }
  });

  describe('Property 4: MFA enforcement consistency', () => {
    it('should require MFA token when organization policy enforces MFA', async () => {
      if (process.env['SKIP_DB_TESTS'] === 'true') {
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            firstName: fc.stringMatching(/^[A-Za-z][A-Za-z ]{1,19}$/),
            lastName: fc.stringMatching(/^[A-Za-z][A-Za-z ]{1,19}$/),
            password: fc.stringMatching(/^[A-Za-z0-9!@#$%]{8,30}$/),
          }),
          async (userData) => {
            // Clear users to prevent email duplication
            await User.deleteMany({ organizationId: testOrgId });
            // Enable organization-wide MFA
            await Organization.findByIdAndUpdate(testOrgId, {
              'settings.securitySettings.mfaRequired': true,
            });

            // Create user
            const user = await User.create({
              organizationId: testOrgId,
              email: userData.email,
              password: userData.password,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: 'employee',
              isActive: true,
              mfaEnabled: false, // User hasn't enabled MFA yet
              preferences: {
                language: 'en',
                timezone: 'UTC',
                dateFormat: 'YYYY-MM-DD',
                notifications: {
                  email: true,
                  push: true,
                  sms: false,
                },
              },
            });

            // Try to login without MFA token
            const loginResponse = await AuthService.login({
              email: userData.email,
              password: userData.password,
            });

            // Should indicate MFA is required
            expect(loginResponse.mfaRequired).toBe(true);
            expect(loginResponse.accessToken).toBe('');
            expect(loginResponse.refreshToken).toBe('');

            // Cleanup
            await User.findByIdAndDelete(user._id);
            await Organization.findByIdAndUpdate(testOrgId, {
              'settings.securitySettings.mfaRequired': false,
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should allow login with valid MFA token', async () => {
      if (process.env['SKIP_DB_TESTS'] === 'true') {
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            firstName: fc.stringMatching(/^[A-Za-z][A-Za-z ]{1,19}$/),
            lastName: fc.stringMatching(/^[A-Za-z][A-Za-z ]{1,19}$/),
            password: fc.stringMatching(/^[A-Za-z0-9!@#$%]{8,30}$/),
          }),
          async (userData) => {
            // Create user
            const user = await User.create({
              organizationId: testOrgId,
              email: userData.email,
              password: userData.password,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: 'employee',
              isActive: true,
              mfaEnabled: false,
              preferences: {
                language: 'en',
                timezone: 'UTC',
                dateFormat: 'YYYY-MM-DD',
                notifications: {
                  email: true,
                  push: true,
                  sms: false,
                },
              },
            });

            // Setup MFA
            const mfaSetup = await AuthService.setupMfa(user._id);
            expect(mfaSetup.secret).toBeDefined();
            expect(mfaSetup.qrCode).toBeDefined();
            expect(mfaSetup.backupCodes.length).toBe(10);

            // Generate valid TOTP token
            const validToken = speakeasy.totp({
              secret: mfaSetup.secret,
              encoding: 'base32',
            });

            // Verify and enable MFA
            await AuthService.verifyAndEnableMfa(user._id, validToken);

            // Now login with MFA token
            const validToken2 = speakeasy.totp({
              secret: mfaSetup.secret,
              encoding: 'base32',
            });

            const loginResponse = await AuthService.login({
              email: userData.email,
              password: userData.password,
              mfaToken: validToken2,
            });

            // Should successfully login
            expect(loginResponse.mfaRequired).toBeUndefined();
            expect(loginResponse.accessToken).toBeTruthy();
            expect(loginResponse.refreshToken).toBeTruthy();

            // Cleanup
            await User.findByIdAndDelete(user._id);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject invalid MFA tokens', async () => {
      if (process.env['SKIP_DB_TESTS'] === 'true') {
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            firstName: fc.stringMatching(/^[A-Za-z][A-Za-z ]{1,19}$/),
            lastName: fc.stringMatching(/^[A-Za-z][A-Za-z ]{1,19}$/),
            password: fc.stringMatching(/^[A-Za-z0-9!@#$%]{8,30}$/),
            invalidToken: fc.string({ minLength: 6, maxLength: 6 }).filter(t => !/^\d{6}$/.test(t)),
          }),
          async (userData) => {
            // Create user with MFA enabled
            const user = await User.create({
              organizationId: testOrgId,
              email: userData.email,
              password: userData.password,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: 'employee',
              isActive: true,
              mfaEnabled: false,
              preferences: {
                language: 'en',
                timezone: 'UTC',
                dateFormat: 'YYYY-MM-DD',
                notifications: {
                  email: true,
                  push: true,
                  sms: false,
                },
              },
            });

            // Setup and enable MFA
            const mfaSetup = await AuthService.setupMfa(user._id);
            const validToken = speakeasy.totp({
              secret: mfaSetup.secret,
              encoding: 'base32',
            });
            await AuthService.verifyAndEnableMfa(user._id, validToken);

            // Try to login with invalid MFA token
            let errorThrown = false;
            try {
              await AuthService.login({
                email: userData.email,
                password: userData.password,
                mfaToken: userData.invalidToken,
              });
            } catch (error: any) {
              errorThrown = true;
              expect(error.code).toBe('INVALID_MFA_TOKEN');
            }

            expect(errorThrown).toBe(true);

            // Cleanup
            await User.findByIdAndDelete(user._id);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should accept backup codes as alternative to TOTP', async () => {
      if (process.env['SKIP_DB_TESTS'] === 'true') {
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            firstName: fc.stringMatching(/^[A-Za-z][A-Za-z ]{1,19}$/),
            lastName: fc.stringMatching(/^[A-Za-z][A-Za-z ]{1,19}$/),
            password: fc.stringMatching(/^[A-Za-z0-9!@#$%]{8,30}$/),
          }),
          async (userData) => {
            // Create user
            const user = await User.create({
              organizationId: testOrgId,
              email: userData.email,
              password: userData.password,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: 'employee',
              isActive: true,
              mfaEnabled: false,
              preferences: {
                language: 'en',
                timezone: 'UTC',
                dateFormat: 'YYYY-MM-DD',
                notifications: {
                  email: true,
                  push: true,
                  sms: false,
                },
              },
            });

            // Setup and enable MFA
            const mfaSetup = await AuthService.setupMfa(user._id);
            const validToken = speakeasy.totp({
              secret: mfaSetup.secret,
              encoding: 'base32',
            });
            await AuthService.verifyAndEnableMfa(user._id, validToken);

            // Use one of the backup codes
            const backupCode = mfaSetup.backupCodes[0]!;

            const loginResponse = await AuthService.login({
              email: userData.email,
              password: userData.password,
              mfaToken: backupCode,
            });

            // Should successfully login
            expect(loginResponse.accessToken).toBeTruthy();
            expect(loginResponse.refreshToken).toBeTruthy();

            // Verify backup code is removed after use
            const updatedUser = await User.findById(user._id).select('+mfaBackupCodes');
            expect(updatedUser!.mfaBackupCodes.length).toBe(9); // One used

            // Try to use the same backup code again
            let errorThrown = false;
            try {
              await AuthService.login({
                email: userData.email,
                password: userData.password,
                mfaToken: backupCode,
              });
            } catch (error: any) {
              errorThrown = true;
              expect(error.code).toBe('INVALID_MFA_TOKEN');
            }

            expect(errorThrown).toBe(true);

            // Cleanup
            await User.findByIdAndDelete(user._id);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should allow disabling MFA with password verification', async () => {
      if (process.env['SKIP_DB_TESTS'] === 'true') {
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            firstName: fc.stringMatching(/^[A-Za-z][A-Za-z ]{1,19}$/),
            lastName: fc.stringMatching(/^[A-Za-z][A-Za-z ]{1,19}$/),
            password: fc.stringMatching(/^[A-Za-z0-9!@#$%]{8,30}$/),
            wrongPassword: fc.string({ minLength: 8, maxLength: 30 }),
          }),
          async (userData) => {
            // Ensure passwords are different
            if (userData.wrongPassword === userData.password) {
              userData.wrongPassword = userData.password + 'WRONG';
            }

            // Create user
            const user = await User.create({
              organizationId: testOrgId,
              email: userData.email,
              password: userData.password,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: 'employee',
              isActive: true,
              mfaEnabled: false,
              preferences: {
                language: 'en',
                timezone: 'UTC',
                dateFormat: 'YYYY-MM-DD',
                notifications: {
                  email: true,
                  push: true,
                  sms: false,
                },
              },
            });

            // Setup and enable MFA
            const mfaSetup = await AuthService.setupMfa(user._id);
            const validToken = speakeasy.totp({
              secret: mfaSetup.secret,
              encoding: 'base32',
            });
            await AuthService.verifyAndEnableMfa(user._id, validToken);

            // Try to disable with wrong password
            let errorThrown = false;
            try {
              await AuthService.disableMfa(user._id, userData.wrongPassword);
            } catch (error: any) {
              errorThrown = true;
              expect(error.code).toBe('INVALID_PASSWORD');
            }

            expect(errorThrown).toBe(true);

            // Disable with correct password
            await AuthService.disableMfa(user._id, userData.password);

            // Verify MFA is disabled
            const updatedUser = await User.findById(user._id).select('+mfaSecret');
            expect(updatedUser!.mfaEnabled).toBe(false);
            expect(updatedUser!.mfaSecret).toBeFalsy();
            expect(updatedUser!.mfaBackupCodes.length).toBe(0);

            // Cleanup
            await User.findByIdAndDelete(user._id);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
