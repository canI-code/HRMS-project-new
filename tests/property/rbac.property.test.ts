import * as fc from 'fast-check';
import { permissionRegistry, checkPermission, enforceOrganizationBoundary } from '@/shared/middleware/rbac';
import { UserRole } from '@/shared/types/common';
import { Types } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/utils/AppError';
import { objectIdArbitrary, userRoleArbitrary } from '../utils/generators';

/**
 * **Feature: enterprise-hrms, Property 5: RBAC enforcement**
 * **Validates: Requirements 1.5**
 */
describe('RBAC Property Tests', () => {
  // Generator for resource and action combinations
  const resourceActionArbitrary = () =>
    fc.record({
      resource: fc.constantFrom('employees', 'attendance', 'leave', 'payroll', 'performance', 'documents', 'admin'),
      action: fc.constantFrom('read', 'create', 'update', 'delete', 'approve'),
    });

  // Generator for user context
  const userContextArbitrary = () =>
    fc.record({
      userId: objectIdArbitrary(),
      organizationId: objectIdArbitrary(),
      userRole: userRoleArbitrary(),
    });

  // Mock request object
  const createMockRequest = (user: any, params: any = {}, body: any = {}): Partial<Request> => ({
    user,
    params,
    body,
    requestId: 'test-request-id',
  });

  // Mock response object
  const createMockResponse = (): Partial<Response> => ({});

  describe('Property 5: RBAC enforcement', () => {
    it('should grant access if and only if user role and organizational hierarchy permit it', () => {
      fc.assert(
        fc.property(
          userContextArbitrary(),
          resourceActionArbitrary(),
          objectIdArbitrary(), // target organization
          (userContext, resourceAction, targetOrgId) => {
            const { resource, action } = resourceAction;
            const { organizationId, userRole } = userContext;

            // Test permission check directly
            const hasPermission = permissionRegistry.hasPermission(
              userRole,
              organizationId,
              resource,
              action,
              undefined, // current user ID
              undefined, // no target user for this test
              targetOrgId
            );

            // Super admin should have access to everything that exists
            if (userRole === UserRole.SUPER_ADMIN) {
              const permission = permissionRegistry.getPermission(resource, action);
              if (permission) {
                expect(hasPermission).toBe(true);
              } else {
                expect(hasPermission).toBe(false);
              }
              return;
            }

            // Check if permission exists for this resource/action combination
            const permission = permissionRegistry.getPermission(resource, action);
            if (!permission) {
              expect(hasPermission).toBe(false);
              return;
            }

            // Check role hierarchy
            const roleHierarchy = {
              [UserRole.EMPLOYEE]: 1,
              [UserRole.MANAGER]: 2,
              [UserRole.HR_ADMIN]: 3,
              [UserRole.SUPER_ADMIN]: 4,
            };

            const userRoleLevel = roleHierarchy[userRole];
            const requiredRoleLevel = roleHierarchy[permission.minRole];

            if (userRoleLevel < requiredRoleLevel) {
              expect(hasPermission).toBe(false);
              return;
            }

            // Check organization boundary
            if (permission.organizationBoundary && !organizationId.equals(targetOrgId)) {
              // Only super admin can cross organization boundaries
              expect(hasPermission).toBe(false);
              return;
            }

            // If all checks pass, should have permission
            expect(hasPermission).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce organization boundaries consistently', () => {
      fc.assert(
        fc.property(
          userContextArbitrary(),
          objectIdArbitrary(), // target organization
          (userContext, targetOrgId) => {
            const { userId, organizationId, userRole } = userContext;

            let middlewareError: Error | null = null;
            let nextCalled = false;

            const mockReq = createMockRequest({ userId, organizationId, userRole });
            const mockRes = createMockResponse();
            const mockNext: NextFunction = (error?: any) => {
              if (error) {
                middlewareError = error;
              } else {
                nextCalled = true;
              }
            };

            // Create middleware that extracts target org from params
            const middleware = enforceOrganizationBoundary(() => targetOrgId);

            // Execute middleware
            middleware(mockReq as Request, mockRes as Response, mockNext);

            // Super admin should always pass
            if (userRole === UserRole.SUPER_ADMIN) {
              expect(nextCalled).toBe(true);
              expect(middlewareError).toBeNull();
              return;
            }

            // Same organization should pass
            if (organizationId.equals(targetOrgId)) {
              expect(nextCalled).toBe(true);
              expect(middlewareError).toBeNull();
              return;
            }

            // Different organization should fail for non-super-admin
            expect(nextCalled).toBe(false);
            if (middlewareError) {
              expect(middlewareError).toBeInstanceOf(AppError);
              expect((middlewareError as AppError).code).toBe('ORGANIZATION_BOUNDARY_VIOLATION');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain role hierarchy consistency', () => {
      fc.assert(
        fc.property(
          fc.tuple(userRoleArbitrary(), userRoleArbitrary()),
          ([higherRole, lowerRole]) => {
            const roleHierarchy = {
              [UserRole.EMPLOYEE]: 1,
              [UserRole.MANAGER]: 2,
              [UserRole.HR_ADMIN]: 3,
              [UserRole.SUPER_ADMIN]: 4,
            };

            const higherRoleLevel = roleHierarchy[higherRole];
            const lowerRoleLevel = roleHierarchy[lowerRole];

            // If one role is actually higher than the other
            if (higherRoleLevel > lowerRoleLevel) {
              // Higher role should have at least as many permissions as lower role
              const higherRolePermissions = permissionRegistry.getPermissionsForRole(higherRole);
              const lowerRolePermissions = permissionRegistry.getPermissionsForRole(lowerRole);

              expect(higherRolePermissions.length).toBeGreaterThanOrEqual(lowerRolePermissions.length);

              // Every permission available to lower role should be available to higher role
              lowerRolePermissions.forEach(permission => {
                const hasPermission = higherRolePermissions.some(
                  p => p.resource === permission.resource && p.action === permission.action
                );
                expect(hasPermission).toBe(true);
              });
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle self-access permissions correctly', () => {
      fc.assert(
        fc.property(
          userContextArbitrary(),
          resourceActionArbitrary(),
          (userContext, resourceAction) => {
            const { userId, organizationId, userRole } = userContext;
            const { resource, action } = resourceAction;

            // Test self-access (using same user ID for both current user and target)
            const hasSelfPermission = permissionRegistry.hasPermission(
              userRole,
              organizationId,
              resource,
              action,
              userId, // current user ID
              userId, // target user is self
              organizationId
            );

            // Test access to different user
            const otherUserId = new Types.ObjectId();
            const hasOtherPermission = permissionRegistry.hasPermission(
              userRole,
              organizationId,
              resource,
              action,
              userId, // current user ID
              otherUserId, // different target user
              organizationId
            );

            const permission = permissionRegistry.getPermission(resource, action);
            if (!permission) {
              expect(hasSelfPermission).toBe(false);
              expect(hasOtherPermission).toBe(false);
              return;
            }

            const roleHierarchy = {
              [UserRole.EMPLOYEE]: 1,
              [UserRole.MANAGER]: 2,
              [UserRole.HR_ADMIN]: 3,
              [UserRole.SUPER_ADMIN]: 4,
            };

            const userRoleLevel = roleHierarchy[userRole];
            const requiredRoleLevel = roleHierarchy[permission.minRole];

            // If user has sufficient role level, both should be true
            if (userRoleLevel >= requiredRoleLevel) {
              expect(hasSelfPermission).toBe(true);
              expect(hasOtherPermission).toBe(true);
            } else if (permission.allowSelfAccess) {
              // If role is insufficient but self-access is allowed, only self should be true
              expect(hasSelfPermission).toBe(true);
              expect(hasOtherPermission).toBe(false);
            } else {
              // If role is insufficient and no self-access, both should be false
              expect(hasSelfPermission).toBe(false);
              expect(hasOtherPermission).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate permission middleware behavior', () => {
      fc.assert(
        fc.property(
          userContextArbitrary(),
          resourceActionArbitrary(),
          (userContext, resourceAction) => {
            const { userId, organizationId, userRole } = userContext;
            const { resource, action } = resourceAction;

            let middlewareError: Error | null = null;
            let nextCalled = false;

            const mockReq = createMockRequest({ userId, organizationId, userRole, requestId: 'test' });
            const mockRes = createMockResponse();
            const mockNext: NextFunction = (error?: any) => {
              if (error) {
                middlewareError = error;
              } else {
                nextCalled = true;
              }
            };

            // Create permission middleware
            const middleware = checkPermission(resource, action);

            // Execute middleware
            middleware(mockReq as Request, mockRes as Response, mockNext);

            // Check if permission should be granted
            const shouldHavePermission = permissionRegistry.hasPermission(
              userRole,
              organizationId,
              resource,
              action,
              userId, // current user ID
              undefined, // no specific target user
              organizationId
            );

            if (shouldHavePermission) {
              expect(nextCalled).toBe(true);
              expect(middlewareError).toBeNull();
            } else {
              expect(nextCalled).toBe(false);
              if (middlewareError) {
                expect(middlewareError).toBeInstanceOf(AppError);
                expect((middlewareError as AppError).code).toBe('INSUFFICIENT_PERMISSIONS');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});