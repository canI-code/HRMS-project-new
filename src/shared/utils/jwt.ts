import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { UserRole } from '@/shared/types/common';
import { AppError } from './AppError';
import { logger } from './logger';

export interface JwtPayload {
  userId: string;
  organizationId: string;
  userRole: UserRole;
  email: string;
  tokenType: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JwtService {
  private static readonly ACCESS_TOKEN_SECRET = process.env['JWT_ACCESS_SECRET'] || 'access-secret';
  private static readonly REFRESH_TOKEN_SECRET = process.env['JWT_REFRESH_SECRET'] || 'refresh-secret';
  private static readonly ACCESS_TOKEN_EXPIRY = process.env['JWT_ACCESS_EXPIRY'] || '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = process.env['JWT_REFRESH_EXPIRY'] || '7d';

  /**
   * Generate access and refresh token pair
   */
  static generateTokenPair(payload: {
    userId: Types.ObjectId;
    organizationId: Types.ObjectId;
    userRole: UserRole;
    email: string;
  }): TokenPair {
    const basePayload = {
      userId: payload.userId.toString(),
      organizationId: payload.organizationId.toString(),
      userRole: payload.userRole,
      email: payload.email,
    };

    const accessToken = jwt.sign(
      { ...basePayload, tokenType: 'access' },
      this.ACCESS_TOKEN_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY } as any
    );

    const refreshToken = jwt.sign(
      { ...basePayload, tokenType: 'refresh' },
      this.REFRESH_TOKEN_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY } as any
    );

    logger.info('Token pair generated', {
      userId: payload.userId.toString(),
      organizationId: payload.organizationId.toString(),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET) as JwtPayload;
      
      if (decoded.tokenType !== 'access') {
        throw new AppError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid access token', 401, 'INVALID_ACCESS_TOKEN');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Access token expired', 401, 'ACCESS_TOKEN_EXPIRED');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET) as JwtPayload;
      
      if (decoded.tokenType !== 'refresh') {
        throw new AppError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Refresh token expired', 401, 'REFRESH_TOKEN_EXPIRED');
      }
      throw error;
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader?: string): string {
    if (!authHeader) {
      throw new AppError('Authorization header missing', 401, 'MISSING_AUTH_HEADER');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError('Invalid authorization header format', 401, 'INVALID_AUTH_HEADER');
    }

    const token = parts[1];
    if (!token) {
      throw new AppError('Token missing from authorization header', 401, 'MISSING_TOKEN');
    }

    return token;
  }

  /**
   * Refresh access token using refresh token
   */
  static refreshAccessToken(refreshToken: string): string {
    const decoded = this.verifyRefreshToken(refreshToken);
    
    const newAccessToken = jwt.sign(
      {
        userId: decoded.userId,
        organizationId: decoded.organizationId,
        userRole: decoded.userRole,
        email: decoded.email,
        tokenType: 'access',
      },
      this.ACCESS_TOKEN_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY } as any
    );

    logger.info('Access token refreshed', {
      userId: decoded.userId,
      organizationId: decoded.organizationId,
    });

    return newAccessToken;
  }

  /**
   * Decode token without verification (for debugging/logging)
   */
  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
/**
 * Helper function to generate access token
 */
export function generateAccessToken(payload: {
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  userRole: UserRole;
}): string {
  return jwt.sign(
    {
      userId: payload.userId.toString(),
      organizationId: payload.organizationId.toString(),
      userRole: payload.userRole,
      tokenType: 'access',
    },
    process.env['JWT_ACCESS_SECRET'] || 'access-secret',
    { expiresIn: process.env['JWT_ACCESS_EXPIRY'] || '15m' } as any
  );
}

/**
 * Helper function to generate refresh token
 */
export function generateRefreshToken(payload: {
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  userRole: UserRole;
}): string {
  return jwt.sign(
    {
      userId: payload.userId.toString(),
      organizationId: payload.organizationId.toString(),
      userRole: payload.userRole,
      tokenType: 'refresh',
    },
    process.env['JWT_REFRESH_SECRET'] || 'refresh-secret',
    { expiresIn: process.env['JWT_REFRESH_EXPIRY'] || '7d' } as any
  );
}

/**
 * Helper function to verify token (detects type automatically)
 */
export function verifyToken(token: string): JwtPayload {
  // Try to decode first to check type
  const decoded = jwt.decode(token) as JwtPayload;
  
  if (!decoded || !decoded.tokenType) {
    throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }

  if (decoded.tokenType === 'access') {
    return JwtService.verifyAccessToken(token);
  } else if (decoded.tokenType === 'refresh') {
    return JwtService.verifyRefreshToken(token);
  }
  
  throw new AppError('Unknown token type', 401, 'UNKNOWN_TOKEN_TYPE');
}
