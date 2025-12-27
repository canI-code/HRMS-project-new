import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { JwtService, JwtPayload } from '@/shared/utils/jwt';
import { TokenBlacklistService } from '@/shared/utils/tokenBlacklist';
import { AppError } from '@/shared/utils/AppError';
import { UserRole, RequestContext } from '@/shared/types/common';
import { logger } from '@/shared/utils/logger';

// Extend Express Request interface to include user context
declare global {
  namespace Express {
    interface Request {
      user?: RequestContext;
    }
  }
}

/**
 * Authentication middleware that validates JWT tokens
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = JwtService.extractTokenFromHeader(authHeader);

    // Check if token is blacklisted
    if (TokenBlacklistService.isTokenBlacklisted(token)) {
      throw new AppError('Token has been revoked', 401, 'TOKEN_REVOKED');
    }

    // Verify and decode token
    const decoded: JwtPayload = JwtService.verifyAccessToken(token);

    // Create request context
    const requestContext: RequestContext = {
      userId: new Types.ObjectId(decoded.userId),
      organizationId: new Types.ObjectId(decoded.organizationId),
      userRole: decoded.userRole,
      requestId: req.requestId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
    };

    // Attach user context to request
    req.user = requestContext;

    logger.debug('User authenticated', {
      userId: decoded.userId,
      organizationId: decoded.organizationId,
      userRole: decoded.userRole,
      requestId: req.requestId,
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    next(error);
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    // If no auth header, continue without user context
    if (!authHeader) {
      return next();
    }

    // Try to authenticate, but don't fail if token is invalid
    try {
      const token = JwtService.extractTokenFromHeader(authHeader);
      
      if (!TokenBlacklistService.isTokenBlacklisted(token)) {
        const decoded: JwtPayload = JwtService.verifyAccessToken(token);
        
        req.user = {
          userId: new Types.ObjectId(decoded.userId),
          organizationId: new Types.ObjectId(decoded.organizationId),
          userRole: decoded.userRole,
          requestId: req.requestId,
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
        };
      }
    } catch {
      // Ignore authentication errors in optional mode
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require specific user roles
 */
export const requireRoles = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    if (!roles.includes(req.user.userRole)) {
      logger.warn('Insufficient permissions', {
        userId: req.user.userId.toString(),
        userRole: req.user.userRole,
        requiredRoles: roles,
        requestId: req.requestId,
      });

      return next(new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS', {
        userRole: req.user.userRole,
        requiredRoles: roles,
      }));
    }

    next();
  };
};

/**
 * Middleware to require super admin role
 */
export const requireSuperAdmin = requireRoles(UserRole.SUPER_ADMIN);

/**
 * Middleware to require HR admin or super admin role
 */
export const requireHRAdmin = requireRoles(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN);

/**
 * Middleware to require manager, HR admin, or super admin role
 */
export const requireManager = requireRoles(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER);

/**
 * Middleware to allow access to own resources or higher roles
 */
export const requireSelfOrHigher = (getUserIdFromParams: (req: Request) => string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    const targetUserId = getUserIdFromParams(req);
    const isOwnResource = req.user.userId.toString() === targetUserId;
    const hasHigherRole = [UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER].includes(req.user.userRole);

    if (!isOwnResource && !hasHigherRole) {
      logger.warn('Access denied to resource', {
        userId: req.user.userId.toString(),
        targetUserId,
        userRole: req.user.userRole,
        requestId: req.requestId,
      });

      return next(new AppError('Access denied', 403, 'ACCESS_DENIED'));
    }

    next();
  };
};

/**
 * Logout middleware that blacklists the current token
 */
export const logout = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = JwtService.extractTokenFromHeader(authHeader);
      const decoded = JwtService.decodeToken(token);
      
      if (decoded && decoded.exp) {
        // Blacklist token until its natural expiry
        TokenBlacklistService.blacklistToken(token, decoded.exp * 1000);
      }
    }

    logger.info('User logged out', {
      userId: req.user?.userId.toString(),
      requestId: req.requestId,
    });

    next();
  } catch (error) {
    next(error);
  }
};