import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { UserRole } from '@/shared/types/common';
import { AppError } from '@/shared/utils/AppError';
import { logger } from '@/shared/utils/logger';

/**
 * Role hierarchy for permission checking
 * Higher roles inherit permissions from lower roles
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.EMPLOYEE]: 1,
  [UserRole.MANAGER]: 2,
  [UserRole.HR_ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4,
};

/**
 * Resource permissions mapping
 */
export interface ResourcePermission {
  resource: string;
  action: string;
  minRole: UserRole;
  allowSelfAccess?: boolean;
  organizationBoundary?: boolean;
}

/**
 * Default resource permissions
 */
export const DEFAULT_PERMISSIONS: ResourcePermission[] = [
  // Employee management
  { resource: 'employees', action: 'read', minRole: UserRole.MANAGER, allowSelfAccess: true, organizationBoundary: true },
  { resource: 'employees', action: 'create', minRole: UserRole.HR_ADMIN, organizationBoundary: true },
  { resource: 'employees', action: 'update', minRole: UserRole.HR_ADMIN, allowSelfAccess: true, organizationBoundary: true },
  { resource: 'employees', action: 'delete', minRole: UserRole.HR_ADMIN, organizationBoundary: true },
  
  // Attendance management
  { resource: 'attendance', action: 'read', minRole: UserRole.MANAGER, allowSelfAccess: true, organizationBoundary: true },
  { resource: 'attendance', action: 'create', minRole: UserRole.EMPLOYEE, allowSelfAccess: true, organizationBoundary: true },
  { resource: 'attendance', action: 'update', minRole: UserRole.MANAGER, allowSelfAccess: true, organizationBoundary: true },
  
  // Leave management
  { resource: 'leaves', action: 'read', minRole: UserRole.MANAGER, allowSelfAccess: true, organizationBoundary: true },
  { resource: 'leaves', action: 'create', minRole: UserRole.EMPLOYEE, allowSelfAccess: true, organizationBoundary: true },
  { resource: 'leaves', action: 'update', minRole: UserRole.MANAGER, allowSelfAccess: true, organizationBoundary: true },
  
  // Payroll management
  { resource: 'payroll', action: 'read', minRole: UserRole.HR_ADMIN, allowSelfAccess: true, organizationBoundary: true },
  { resource: 'payroll', action: 'create', minRole: UserRole.HR_ADMIN, organizationBoundary: true },
  { resource: 'payroll', action: 'update', minRole: UserRole.HR_ADMIN, organizationBoundary: true },
  { resource: 'payroll-structure', action: 'create', minRole: UserRole.HR_ADMIN, organizationBoundary: true },
  { resource: 'payroll-structure', action: 'read', minRole: UserRole.HR_ADMIN, organizationBoundary: true },
  { resource: 'payroll-structure', action: 'update', minRole: UserRole.HR_ADMIN, organizationBoundary: true },
  
  // Performance management
  { resource: 'performance', action: 'read', minRole: UserRole.MANAGER, allowSelfAccess: true, organizationBoundary: true },
  { resource: 'performance', action: 'create', minRole: UserRole.MANAGER, organizationBoundary: true },
  { resource: 'performance', action: 'update', minRole: UserRole.MANAGER, allowSelfAccess: true, organizationBoundary: true },
  
  // Document management
  { resource: 'documents', action: 'read', minRole: UserRole.EMPLOYEE, organizationBoundary: true },
  { resource: 'documents', action: 'create', minRole: UserRole.MANAGER, organizationBoundary: true },
  { resource: 'documents', action: 'update', minRole: UserRole.MANAGER, organizationBoundary: true },
  { resource: 'documents', action: 'delete', minRole: UserRole.HR_ADMIN, organizationBoundary: true },

  // Notification management
  { resource: 'notifications', action: 'read', minRole: UserRole.MANAGER, organizationBoundary: true },
  { resource: 'notifications', action: 'create', minRole: UserRole.HR_ADMIN, organizationBoundary: true },
  { resource: 'notifications', action: 'update', minRole: UserRole.HR_ADMIN, organizationBoundary: true },
  { resource: 'notifications', action: 'preferences', minRole: UserRole.EMPLOYEE, allowSelfAccess: true, organizationBoundary: true },
  
  // System administration
  { resource: 'admin', action: 'read', minRole: UserRole.SUPER_ADMIN, organizationBoundary: false },
  { resource: 'admin', action: 'create', minRole: UserRole.SUPER_ADMIN, organizationBoundary: false },
  { resource: 'admin', action: 'update', minRole: UserRole.SUPER_ADMIN, organizationBoundary: false },
  { resource: 'admin', action: 'delete', minRole: UserRole.SUPER_ADMIN, organizationBoundary: false },
];

/**
 * Permission registry for dynamic permission management
 */
class PermissionRegistry {
  private permissions: Map<string, ResourcePermission> = new Map();

  constructor() {
    // Load default permissions
    DEFAULT_PERMISSIONS.forEach(permission => {
      const key = `${permission.resource}:${permission.action}`;
      this.permissions.set(key, permission);
    });
  }

  /**
   * Register a new permission
   */
  register(permission: ResourcePermission): void {
    const key = `${permission.resource}:${permission.action}`;
    this.permissions.set(key, permission);
    
    logger.debug('Permission registered', {
      resource: permission.resource,
      action: permission.action,
      minRole: permission.minRole,
    });
  }

  /**
   * Get permission for resource and action
   */
  getPermission(resource: string, action: string): ResourcePermission | undefined {
    const key = `${resource}:${action}`;
    return this.permissions.get(key);
  }

  /**
   * Check if user has permission for resource and action
   */
  hasPermission(
    userRole: UserRole,
    userOrganizationId: Types.ObjectId,
    resource: string,
    action: string,
    currentUserId?: Types.ObjectId,
    targetUserId?: Types.ObjectId,
    targetOrganizationId?: Types.ObjectId
  ): boolean {
    const permission = this.getPermission(resource, action);
    
    if (!permission) {
      logger.warn('Permission not found', { resource, action });
      return false;
    }

    // Super admin has access to everything
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Check role hierarchy
    const userRoleLevel = ROLE_HIERARCHY[userRole];
    const requiredRoleLevel = ROLE_HIERARCHY[permission.minRole];
    
    if (userRoleLevel < requiredRoleLevel) {
      // Check if self-access is allowed
      if (permission.allowSelfAccess && currentUserId && targetUserId && currentUserId.equals(targetUserId)) {
        return true;
      }
      return false;
    }

    // Check organization boundary
    if (permission.organizationBoundary && targetOrganizationId) {
      if (!userOrganizationId.equals(targetOrganizationId)) {
        // Only super admin can cross organization boundaries (already handled above)
        return false;
      }
    }

    return true;
  }

  /**
   * Get all permissions for a role
   */
  getPermissionsForRole(role: UserRole): ResourcePermission[] {
    const roleLevel = ROLE_HIERARCHY[role];
    return Array.from(this.permissions.values()).filter(
      permission => ROLE_HIERARCHY[permission.minRole] <= roleLevel
    );
  }
}

// Global permission registry instance
export const permissionRegistry = new PermissionRegistry();

/**
 * Middleware to check resource-based permissions
 */
export const checkPermission = (
  resource: string,
  action: string,
  options: {
    getUserId?: (req: Request) => Types.ObjectId | undefined;
    getOrganizationId?: (req: Request) => Types.ObjectId | undefined;
  } = {}
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    const { userId: currentUserId, organizationId: currentOrgId, userRole } = req.user;
    
    // Get target user and organization from request if provided
    const targetUserId = options.getUserId ? options.getUserId(req) : undefined;
    const targetOrgId = options.getOrganizationId ? options.getOrganizationId(req) : currentOrgId;

    // Check permission
    const hasPermission = permissionRegistry.hasPermission(
      userRole,
      currentOrgId,
      resource,
      action,
      currentUserId, // current user ID
      targetUserId,
      targetOrgId
    );

    if (!hasPermission) {
      logger.warn('Permission denied', {
        userId: currentUserId.toString(),
        userRole,
        resource,
        action,
        targetUserId: targetUserId?.toString(),
        targetOrgId: targetOrgId?.toString(),
        requestId: req.requestId,
      });

      return next(new AppError(
        'Insufficient permissions for this action',
        403,
        'INSUFFICIENT_PERMISSIONS',
        {
          resource,
          action,
          requiredRole: permissionRegistry.getPermission(resource, action)?.minRole,
          userRole,
        }
      ));
    }

    logger.debug('Permission granted', {
      userId: currentUserId.toString(),
      userRole,
      resource,
      action,
      requestId: req.requestId,
    });

    next();
  };
};

/**
 * Middleware to enforce organizational boundary
 */
export const enforceOrganizationBoundary = (
  getTargetOrganizationId: (req: Request) => Types.ObjectId | undefined
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    const { organizationId: userOrgId, userRole } = req.user;
    const targetOrgId = getTargetOrganizationId(req);

    // Super admin can access any organization
    if (userRole === UserRole.SUPER_ADMIN) {
      return next();
    }

    // Check if target organization matches user's organization
    if (targetOrgId && !userOrgId.equals(targetOrgId)) {
      logger.warn('Organization boundary violation', {
        userId: req.user.userId.toString(),
        userOrgId: userOrgId.toString(),
        targetOrgId: targetOrgId.toString(),
        requestId: req.requestId,
      });

      return next(new AppError(
        'Access denied: Organization boundary violation',
        403,
        'ORGANIZATION_BOUNDARY_VIOLATION',
        {
          userOrganization: userOrgId.toString(),
          targetOrganization: targetOrgId.toString(),
        }
      ));
    }

    next();
  };
};

/**
 * Middleware to check hierarchical access (manager can access subordinates)
 */
export const checkHierarchicalAccess = (
  getTargetUserId: (req: Request) => Types.ObjectId | undefined,
  // This would typically query the database to check reporting structure
  // For now, we'll use a simple role-based check
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    const { userId: currentUserId, userRole } = req.user;
    const targetUserId = getTargetUserId(req);

    // Self-access is always allowed
    if (targetUserId && currentUserId.equals(targetUserId)) {
      return next();
    }

    // HR Admin and Super Admin can access anyone in their organization
    if ([UserRole.HR_ADMIN, UserRole.SUPER_ADMIN].includes(userRole)) {
      return next();
    }

    // Managers can access their subordinates (this would require database lookup in real implementation)
    if (userRole === UserRole.MANAGER) {
      // TODO: Implement actual hierarchical check by querying employee reporting structure
      return next();
    }

    // Employees can only access their own data
    if (userRole === UserRole.EMPLOYEE && targetUserId && !currentUserId.equals(targetUserId)) {
      logger.warn('Hierarchical access denied', {
        userId: currentUserId.toString(),
        targetUserId: targetUserId.toString(),
        userRole,
        requestId: req.requestId,
      });

      return next(new AppError(
        'Access denied: Insufficient hierarchical permissions',
        403,
        'HIERARCHICAL_ACCESS_DENIED'
      ));
    }

    next();
  };
};

/**
 * Helper function to extract user ID from request parameters
 */
export const getUserIdFromParams = (paramName = 'id') => {
  return (req: Request): Types.ObjectId | undefined => {
    const id = req.params[paramName];
    return id ? new Types.ObjectId(id) : undefined;
  };
};

/**
 * Helper function to extract organization ID from request parameters
 */
export const getOrganizationIdFromParams = (paramName = 'organizationId') => {
  return (req: Request): Types.ObjectId | undefined => {
    const id = req.params[paramName];
    return id ? new Types.ObjectId(id) : undefined;
  };
};

/**
 * Helper function to extract organization ID from request body
 */
export const getOrganizationIdFromBody = (fieldName = 'organizationId') => {
  return (req: Request): Types.ObjectId | undefined => {
    const id = req.body[fieldName];
    return id ? new Types.ObjectId(id) : undefined;
  };
};