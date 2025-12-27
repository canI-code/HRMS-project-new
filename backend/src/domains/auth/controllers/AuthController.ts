import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AppError } from '@/shared/utils/AppError';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication operations
 */
export class AuthController {
  /**
   * User login
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, mfaToken } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required', 400, 'MISSING_CREDENTIALS');
      }

      const result = await AuthService.login({ email, password, mfaToken });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * User logout
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const refreshToken = req.body.refreshToken;

      if (!authHeader || !refreshToken) {
        throw new AppError('Access and refresh tokens are required', 400, 'MISSING_TOKENS');
      }

      const accessToken = authHeader.split(' ')[1] as string;
      
      await AuthService.logout(accessToken, refreshToken as string);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400, 'MISSING_REFRESH_TOKEN');
      }

      const result = await AuthService.refreshAccessToken({ refreshToken });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * POST /api/auth/password-reset/request
   */
  static async requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError('Email is required', 400, 'MISSING_EMAIL');
      }

      await AuthService.requestPasswordReset({ email });

      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm password reset
   * POST /api/auth/password-reset/confirm
   */
  static async confirmPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        throw new AppError('Token and new password are required', 400, 'MISSING_FIELDS');
      }

      await AuthService.confirmPasswordReset({ token, newPassword });

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password (authenticated user)
   * POST /api/auth/password/change
   */
  static async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new AppError(
          'Current password and new password are required',
          400,
          'MISSING_FIELDS'
        );
      }

      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      await AuthService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword
      );

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Setup MFA
   * POST /api/auth/mfa/setup
   */
  static async setupMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const result = await AuthService.setupMfa(req.user.userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify and enable MFA
   * POST /api/auth/mfa/verify
   */
  static async verifyMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        throw new AppError('MFA token is required', 400, 'MISSING_TOKEN');
      }

      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      await AuthService.verifyAndEnableMfa(req.user.userId, token);

      res.status(200).json({
        success: true,
        message: 'MFA enabled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disable MFA
   * POST /api/auth/mfa/disable
   */
  static async disableMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { password } = req.body;

      if (!password) {
        throw new AppError('Password is required', 400, 'MISSING_PASSWORD');
      }

      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      await AuthService.disableMfa(req.user.userId, password);

      res.status(200).json({
        success: true,
        message: 'MFA disabled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email
   * GET /api/auth/verify-email/:token
   */
  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        throw new AppError('Verification token is required', 400, 'MISSING_TOKEN');
      }

      await AuthService.verifyEmail(token);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  static async getCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      // User info is already in req.user from auth middleware
      res.status(200).json({
        success: true,
        data: {
          userId: req.user.userId,
          organizationId: req.user.organizationId,
          userRole: req.user.userRole,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
