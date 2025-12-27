import * as fc from 'fast-check';
import { AuthService } from '@/domains/auth/services/AuthService';
import { User } from '@/domains/auth/models/User';
import { Organization } from '@/domains/auth/models/Organization';
import { TokenBlacklistService } from '@/shared/utils/tokenBlacklist';
import { verifyToken } from '@/shared/utils/jwt';
import { Types } from 'mongoose';

/**
 * **Feature: enterprise-hrms, Property 2: Session termination enforcement**
 * **Validates: Requirements 1.2**
 */
describe('Session Termination Property Tests', () => {
  let testOrgId: Types.ObjectId;

  beforeAll(async () => {
    if (process.env['SKIP_DB_TESTS'] !== 'true') {
      const org = await Organization.create({
        name: 'Test Organization Session',
        displayName: 'Test Org Session',
        domain: 'test-session-term',
        country: 'US',
        currency: 'USD',
        timezone: 'UTC',
        contactInfo: {
          email: 'test-session@test.com',
        },
        subscription: {
          plan: 'professional',
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
            mfaRequired: false,
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

  afterEach(() => {
    // Clear token blacklist after each test
    TokenBlacklistService.clearAll();
  });

  describe('Property 2: Session termination enforcement', () => {
    it('should blacklist tokens on logout', async () => {
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
            // Create user
            const user = await User.create({
              organizationId: testOrgId,
              email: userData.email,
              password: userData.password,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: 'employee',
              isActive: true,
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

            // Login to get tokens
            const loginResponse = await AuthService.login({
              email: userData.email,
              password: userData.password,
            });

            expect(loginResponse.accessToken).toBeTruthy();
            expect(loginResponse.refreshToken).toBeTruthy();

            const { accessToken, refreshToken } = loginResponse;

            // Verify tokens are not blacklisted initially
            expect(TokenBlacklistService.isTokenBlacklisted(accessToken)).toBe(false);
            expect(TokenBlacklistService.isTokenBlacklisted(refreshToken)).toBe(false);

            // Logout
            await AuthService.logout(accessToken, refreshToken);

            // Verify tokens are now blacklisted
            expect(TokenBlacklistService.isTokenBlacklisted(accessToken)).toBe(true);
            expect(TokenBlacklistService.isTokenBlacklisted(refreshToken)).toBe(true);

            // Cleanup
            await User.findByIdAndDelete(user._id);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject blacklisted tokens for token refresh', async () => {
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

            // Login to get tokens
            const loginResponse = await AuthService.login({
              email: userData.email,
              password: userData.password,
            });

            const { accessToken, refreshToken } = loginResponse;

            // Logout to blacklist tokens
            await AuthService.logout(accessToken, refreshToken);

            // Try to refresh using blacklisted token
            let errorThrown = false;
            try {
              await AuthService.refreshAccessToken({ refreshToken });
            } catch (error: any) {
              errorThrown = true;
              expect(error.code).toBe('TOKEN_REVOKED');
            }

            expect(errorThrown).toBe(true);

            // Cleanup
            await User.findByIdAndDelete(user._id);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should allow refresh token to generate new access tokens before logout', async () => {
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
          fc.integer({ min: 1, max: 3 }),
          async (userData, refreshCount) => {
            // Create user
            const user = await User.create({
              organizationId: testOrgId,
              email: userData.email,
              password: userData.password,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: 'employee',
              isActive: true,
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

            // Login to get tokens
            const loginResponse = await AuthService.login({
              email: userData.email,
              password: userData.password,
            });

            let currentRefreshToken = loginResponse.refreshToken;
            const accessTokens: string[] = [loginResponse.accessToken];

            // Refresh access token multiple times
            for (let i = 0; i < refreshCount; i++) {
              const refreshResponse = await AuthService.refreshAccessToken({
                refreshToken: currentRefreshToken,
              });
              
              expect(refreshResponse.accessToken).toBeTruthy();
              accessTokens.push(refreshResponse.accessToken);

              // Verify new token is different
              expect(refreshResponse.accessToken).not.toBe(accessTokens[accessTokens.length - 2]);

              // Verify new token is valid
              const decoded = verifyToken(refreshResponse.accessToken);
              expect(decoded.userId).toBe(user._id.toString());
            }

            // All access tokens should be valid before logout
            for (const token of accessTokens) {
              expect(TokenBlacklistService.isTokenBlacklisted(token)).toBe(false);
            }

            // Logout with latest access token
            const lastAccessToken = accessTokens[accessTokens.length - 1]!;
            await AuthService.logout(lastAccessToken, currentRefreshToken);

            // After logout, the tokens we logged out with should be blacklisted
            expect(TokenBlacklistService.isTokenBlacklisted(currentRefreshToken)).toBe(true);
            expect(TokenBlacklistService.isTokenBlacklisted(lastAccessToken)).toBe(true);

            // Cleanup
            await User.findByIdAndDelete(user._id);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should enforce session termination on user deactivation', async () => {
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

            // Login to get tokens
            const loginResponse = await AuthService.login({
              email: userData.email,
              password: userData.password,
            });

            const { refreshToken } = loginResponse;

            // Deactivate user
            await User.findByIdAndUpdate(user._id, { isActive: false });

            // Try to refresh token with deactivated user
            let errorThrown = false;
            try {
              await AuthService.refreshAccessToken({ refreshToken });
            } catch (error: any) {
              errorThrown = true;
              expect(error.code).toBe('USER_NOT_FOUND');
            }

            expect(errorThrown).toBe(true);

            // Try to login again
            errorThrown = false;
            try {
              await AuthService.login({
                email: userData.email,
                password: userData.password,
              });
            } catch (error: any) {
              errorThrown = true;
              expect(error.code).toBe('INVALID_CREDENTIALS');
            }

            expect(errorThrown).toBe(true);

            // Cleanup
            await User.findByIdAndDelete(user._id);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain separate sessions for same user across different logins', async () => {
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

            // Login twice to create two sessions
            const session1 = await AuthService.login({
              email: userData.email,
              password: userData.password,
            });

            const session2 = await AuthService.login({
              email: userData.email,
              password: userData.password,
            });

            // Tokens should be different
            expect(session1.accessToken).not.toBe(session2.accessToken);
            expect(session1.refreshToken).not.toBe(session2.refreshToken);

            // Both sessions should be valid
            expect(TokenBlacklistService.isTokenBlacklisted(session1.accessToken)).toBe(false);
            expect(TokenBlacklistService.isTokenBlacklisted(session2.accessToken)).toBe(false);

            // Logout from session 1
            await AuthService.logout(session1.accessToken, session1.refreshToken);

            // Session 1 tokens should be blacklisted
            expect(TokenBlacklistService.isTokenBlacklisted(session1.accessToken)).toBe(true);
            expect(TokenBlacklistService.isTokenBlacklisted(session1.refreshToken)).toBe(true);

            // Session 2 tokens should still be valid
            expect(TokenBlacklistService.isTokenBlacklisted(session2.accessToken)).toBe(false);
            expect(TokenBlacklistService.isTokenBlacklisted(session2.refreshToken)).toBe(false);

            // Session 2 should still be able to refresh
            const refreshedSession2 = await AuthService.refreshAccessToken({
              refreshToken: session2.refreshToken,
            });
            expect(refreshedSession2.accessToken).toBeTruthy();

            // Cleanup
            await User.findByIdAndDelete(user._id);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
