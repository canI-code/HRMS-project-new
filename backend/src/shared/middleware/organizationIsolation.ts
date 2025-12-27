import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { UserRole } from '@/shared/types/common';
import { AppError } from '@/shared/utils/AppError';
import { logger } from '@/shared/utils/logger';

/**
 * Organization isolation middleware that ensures multi-tenant data filtering
 * and adds organization context to all requests
 */

// Extend Express Request interface to include organization context
declare global {
  namespace Express {
    interface Request {
      organizationContext?: {
        organizationId: Types.ObjectId;
        canAccessMultipleOrgs: boolean;
        allowedOrganizations: Types.ObjectId[];
      };
    }
  }
}

/**
 * Middleware to add organization context to requests
 */
export const addOrganizationContext = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
  }

  const { organizationId, userRole } = req.user;

  // Super admin can access multiple organizations
  const canAccessMultipleOrgs = userRole === UserRole.SUPER_ADMIN;
  
  // For now, allowed organizations is just the user's organization
  // In a more complex system, this could include subsidiary organizations, etc.
  const allowedOrganizations = canAccessMultipleOrgs 
    ? [] // Empty array means access to all organizations
    : [organizationId];

  req.organizationContext = {
    organizationId,
    canAccessMultipleOrgs,
    allowedOrganizations,
  };

  logger.debug('Organization context added', {
    userId: req.user.userId.toString(),
    organizationId: organizationId.toString(),
    canAccessMultipleOrgs,
    allowedOrganizationsCount: allowedOrganizations.length,
    requestId: req.requestId,
  });

  next();
};

/**
 * Middleware to enforce organization isolation for database queries
 */
export const enforceOrganizationIsolation = (
  getTargetOrganizationId?: (req: Request) => Types.ObjectId | undefined
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !req.organizationContext) {
      return next(new AppError('Authentication and organization context required', 401, 'MISSING_CONTEXT'));
    }

    const { organizationId: userOrgId, userRole } = req.user;
    const { canAccessMultipleOrgs, allowedOrganizations } = req.organizationContext;

    // Get target organization ID from request
    let targetOrgId: Types.ObjectId | undefined;
    
    if (getTargetOrganizationId) {
      targetOrgId = getTargetOrganizationId(req);
    } else {
      // Try to extract from common locations
      targetOrgId = extractOrganizationIdFromRequest(req);
    }

    // If no target organization specified, use user's organization
    if (!targetOrgId) {
      targetOrgId = userOrgId;
    }

    // Super admin can access any organization
    if (canAccessMultipleOrgs) {
      logger.debug('Super admin access granted', {
        userId: req.user.userId.toString(),
        targetOrgId: targetOrgId.toString(),
        requestId: req.requestId,
      });
      return next();
    }

    // Check if user can access the target organization
    const hasAccess = allowedOrganizations.some(orgId => orgId.equals(targetOrgId!));
    
    if (!hasAccess) {
      logger.warn('Organization isolation violation', {
        userId: req.user.userId.toString(),
        userRole,
        userOrgId: userOrgId.toString(),
        targetOrgId: targetOrgId.toString(),
        allowedOrganizations: allowedOrganizations.map(id => id.toString()),
        requestId: req.requestId,
      });

      return next(new AppError(
        'Access denied: Organization isolation violation',
        403,
        'ORGANIZATION_ISOLATION_VIOLATION',
        {
          userOrganization: userOrgId.toString(),
          targetOrganization: targetOrgId.toString(),
          allowedOrganizations: allowedOrganizations.map(id => id.toString()),
        }
      ));
    }

    logger.debug('Organization access granted', {
      userId: req.user.userId.toString(),
      targetOrgId: targetOrgId.toString(),
      requestId: req.requestId,
    });

    next();
  };
};

/**
 * Middleware to automatically filter database queries by organization
 */
export const addOrganizationFilter = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.organizationContext) {
    return next(new AppError('Authentication and organization context required', 401, 'MISSING_CONTEXT'));
  }

  const { organizationId } = req.user;
  const { canAccessMultipleOrgs } = req.organizationContext;

  // Add organization filter to request for use in database queries
  if (!canAccessMultipleOrgs) {
    // Add organization filter to query parameters
    if (!req.query.organizationId) {
      req.query.organizationId = organizationId.toString();
    }

    // Add organization filter to body for create/update operations
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (req.body && typeof req.body === 'object' && !req.body.organizationId) {
        req.body.organizationId = organizationId;
      }
    }
  }

  logger.debug('Organization filter applied', {
    userId: req.user.userId.toString(),
    organizationId: organizationId.toString(),
    method: req.method,
    hasFilter: !canAccessMultipleOrgs,
    requestId: req.requestId,
  });

  next();
};

/**
 * Middleware to validate organization ownership of resources
 */
export const validateOrganizationOwnership = (
  getResourceOrganizationId: (req: Request) => Promise<Types.ObjectId | null>
) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.organizationContext) {
        return next(new AppError('Authentication and organization context required', 401, 'MISSING_CONTEXT'));
      }

      const { organizationId: userOrgId, userRole } = req.user;
      const { canAccessMultipleOrgs } = req.organizationContext;

      // Super admin can access any resource
      if (canAccessMultipleOrgs) {
        return next();
      }

      // Get the organization ID of the resource being accessed
      const resourceOrgId = await getResourceOrganizationId(req);

      if (!resourceOrgId) {
        return next(new AppError('Resource not found', 404, 'RESOURCE_NOT_FOUND'));
      }

      // Check if user's organization owns the resource
      if (!userOrgId.equals(resourceOrgId)) {
        logger.warn('Organization ownership violation', {
          userId: req.user.userId.toString(),
          userRole,
          userOrgId: userOrgId.toString(),
          resourceOrgId: resourceOrgId.toString(),
          requestId: req.requestId,
        });

        return next(new AppError(
          'Access denied: Resource belongs to different organization',
          403,
          'ORGANIZATION_OWNERSHIP_VIOLATION',
          {
            userOrganization: userOrgId.toString(),
            resourceOrganization: resourceOrgId.toString(),
          }
        ));
      }

      logger.debug('Organization ownership validated', {
        userId: req.user.userId.toString(),
        resourceOrgId: resourceOrgId.toString(),
        requestId: req.requestId,
      });

      next();
    } catch (error) {
      logger.error('Error validating organization ownership', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId.toString(),
        requestId: req.requestId,
      });
      next(error);
    }
  };
};

/**
 * Helper function to extract organization ID from common request locations
 */
function extractOrganizationIdFromRequest(req: Request): Types.ObjectId | undefined {
  // Try to extract from URL parameters
  if (req.params.organizationId) {
    return new Types.ObjectId(req.params.organizationId);
  }

  // Try to extract from query parameters
  if (req.query.organizationId && typeof req.query.organizationId === 'string') {
    return new Types.ObjectId(req.query.organizationId);
  }

  // Try to extract from request body
  if (req.body && req.body.organizationId) {
    return new Types.ObjectId(req.body.organizationId);
  }

  return undefined;
}

/**
 * Helper function to create organization-aware database query filter
 */
export const createOrganizationFilter = (req: Request): { organizationId?: Types.ObjectId } => {
  if (!req.user || !req.organizationContext) {
    throw new AppError('Authentication and organization context required', 401, 'MISSING_CONTEXT');
  }

  const { organizationId } = req.user;
  const { canAccessMultipleOrgs } = req.organizationContext;

  // Super admin doesn't need organization filter
  if (canAccessMultipleOrgs) {
    return {};
  }

  return { organizationId };
};

/**
 * Helper function to validate organization ID format
 */
export const validateOrganizationId = (orgId: string): boolean => {
  try {
    new Types.ObjectId(orgId);
    return true;
  } catch {
    return false;
  }
};

/**
 * Middleware to validate organization ID parameters
 */
export const validateOrganizationIdParam = (paramName = 'organizationId') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const orgId = req.params[paramName];
    
    if (orgId && !validateOrganizationId(orgId)) {
      return next(new AppError(
        `Invalid organization ID format: ${paramName}`,
        400,
        'INVALID_ORGANIZATION_ID',
        { paramName, value: orgId }
      ));
    }

    next();
  };
};