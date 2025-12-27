import * as fc from 'fast-check';
import { JwtService } from '@/shared/utils/jwt';
import { TokenBlacklistService } from '@/shared/utils/tokenBlacklist';
import { objectIdArbitrary, userRoleArbitrary, emailArbitrary } from '../utils/generators';

/**
 * **Feature: enterprise-hrms, Property 1: Authentication validation consistency**
 * **Validates: Requirements 1.1**
 */
describe('JWT Authentication Property Tests', () => {
  beforeEach(() => {
    // Clear token blacklist before each test
    TokenBlacklistService.clearAll();
  });

  // Generator for valid JWT payload
  const jwtPayloadArbitrary = () =>
    fc.record({
      userId: objectIdArbitrary(),
      organizationId: objectIdArbitrary(),
      userRole: userRoleArbitrary(),
      email: emailArbitrary(),
    });

  describe('Property 1: Authentication validation consistency', () => {
    it('should grant access if and only if credentials are valid', () => {
      fc.assert(
        fc.property(jwtPayloadArbitrary(), (payload) => {
          // Generate token pair with valid payload
          const { accessToken, refreshToken } = JwtService.generateTokenPair(payload);

          // Valid access token should be verifiable
          const decodedAccess = JwtService.verifyAccessToken(accessToken);
          expect(decodedAccess.userId).toBe(payload.userId.toString());
          expect(decodedAccess.organizationId).toBe(payload.organizationId.toString());
          expect(decodedAccess.userRole).toBe(payload.userRole);
          expect(decodedAccess.email).toBe(payload.email);
          expect(decodedAccess.tokenType).toBe('access');

          // Valid refresh token should be verifiable
          const decodedRefresh = JwtService.verifyRefreshToken(refreshToken);
          expect(decodedRefresh.userId).toBe(payload.userId.toString());
          expect(decodedRefresh.organizationId).toBe(payload.organizationId.toString());
          expect(decodedRefresh.userRole).toBe(payload.userRole);
          expect(decodedRefresh.email).toBe(payload.email);
          expect(decodedRefresh.tokenType).toBe('refresh');
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid tokens consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 200 }).filter(s => !s.includes('.')),
          (invalidToken) => {
            // Invalid tokens should always be rejected
            expect(() => JwtService.verifyAccessToken(invalidToken)).toThrow();
            expect(() => JwtService.verifyRefreshToken(invalidToken)).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject tokens of wrong type consistently', () => {
      fc.assert(
        fc.property(jwtPayloadArbitrary(), (payload) => {
          const { accessToken, refreshToken } = JwtService.generateTokenPair(payload);

          // Access token should not verify as refresh token
          expect(() => JwtService.verifyRefreshToken(accessToken)).toThrow();

          // Refresh token should not verify as access token
          expect(() => JwtService.verifyAccessToken(refreshToken)).toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle token blacklisting consistently', () => {
      fc.assert(
        fc.property(jwtPayloadArbitrary(), (payload) => {
          const { accessToken } = JwtService.generateTokenPair(payload);

          // Token should be valid before blacklisting
          expect(() => JwtService.verifyAccessToken(accessToken)).not.toThrow();
          expect(TokenBlacklistService.isTokenBlacklisted(accessToken)).toBe(false);

          // Blacklist the token
          TokenBlacklistService.blacklistToken(accessToken);

          // Token should be marked as blacklisted
          expect(TokenBlacklistService.isTokenBlacklisted(accessToken)).toBe(true);

          // Token should still be technically valid (JWT verification passes)
          // but application logic should reject blacklisted tokens
          expect(() => JwtService.verifyAccessToken(accessToken)).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should extract tokens from authorization headers consistently', () => {
      fc.assert(
        fc.property(
          jwtPayloadArbitrary(),
          fc.string({ minLength: 10, maxLength: 50 }),
          (payload, randomToken) => {
            const { accessToken } = JwtService.generateTokenPair(payload);

            // Valid Bearer format should extract token correctly
            const validHeader = `Bearer ${accessToken}`;
            expect(JwtService.extractTokenFromHeader(validHeader)).toBe(accessToken);

            // Invalid formats should throw errors
            expect(() => JwtService.extractTokenFromHeader(undefined)).toThrow('Authorization header missing');
            expect(() => JwtService.extractTokenFromHeader('')).toThrow('Authorization header missing');
            expect(() => JwtService.extractTokenFromHeader('Invalid')).toThrow('Invalid authorization header format');
            expect(() => JwtService.extractTokenFromHeader(`Basic ${randomToken}`)).toThrow('Invalid authorization header format');
            expect(() => JwtService.extractTokenFromHeader(`Bearer`)).toThrow('Invalid authorization header format');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should refresh access tokens consistently', () => {
      fc.assert(
        fc.property(jwtPayloadArbitrary(), (payload) => {
          const { refreshToken } = JwtService.generateTokenPair(payload);

          // Should be able to generate new access token from valid refresh token
          const newAccessToken = JwtService.refreshAccessToken(refreshToken);
          expect(typeof newAccessToken).toBe('string');
          expect(newAccessToken.length).toBeGreaterThan(0);

          // New access token should be valid and contain same user data
          const decoded = JwtService.verifyAccessToken(newAccessToken);
          expect(decoded.userId).toBe(payload.userId.toString());
          expect(decoded.organizationId).toBe(payload.organizationId.toString());
          expect(decoded.userRole).toBe(payload.userRole);
          expect(decoded.email).toBe(payload.email);
          expect(decoded.tokenType).toBe('access');
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain token payload integrity across operations', () => {
      fc.assert(
        fc.property(jwtPayloadArbitrary(), (originalPayload) => {
          // Generate tokens
          const { accessToken, refreshToken } = JwtService.generateTokenPair(originalPayload);

          // Decode without verification
          const decodedAccess = JwtService.decodeToken(accessToken);
          const decodedRefresh = JwtService.decodeToken(refreshToken);

          // Both tokens should contain the same user data
          expect(decodedAccess?.userId).toBe(originalPayload.userId.toString());
          expect(decodedAccess?.organizationId).toBe(originalPayload.organizationId.toString());
          expect(decodedAccess?.userRole).toBe(originalPayload.userRole);
          expect(decodedAccess?.email).toBe(originalPayload.email);

          expect(decodedRefresh?.userId).toBe(originalPayload.userId.toString());
          expect(decodedRefresh?.organizationId).toBe(originalPayload.organizationId.toString());
          expect(decodedRefresh?.userRole).toBe(originalPayload.userRole);
          expect(decodedRefresh?.email).toBe(originalPayload.email);

          // Token types should be different
          expect(decodedAccess?.tokenType).toBe('access');
          expect(decodedRefresh?.tokenType).toBe('refresh');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Token Blacklist Properties', () => {
    it('should maintain blacklist state consistently', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 10 }),
          (tokens) => {
            // Clear blacklist
            TokenBlacklistService.clearAll();

            // Initially no tokens should be blacklisted
            tokens.forEach(token => {
              expect(TokenBlacklistService.isTokenBlacklisted(token)).toBe(false);
            });

            // Blacklist all tokens
            tokens.forEach(token => {
              TokenBlacklistService.blacklistToken(token);
            });

            // All tokens should now be blacklisted
            tokens.forEach(token => {
              expect(TokenBlacklistService.isTokenBlacklisted(token)).toBe(true);
            });

            // Stats should reflect the correct count of unique tokens
            const uniqueTokens = new Set(tokens);
            const stats = TokenBlacklistService.getStats();
            expect(stats.totalBlacklisted).toBe(uniqueTokens.size);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});