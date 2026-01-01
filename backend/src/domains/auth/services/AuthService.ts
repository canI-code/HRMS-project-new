import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { User, IUser } from '../models/User';
import { Organization } from '../models/Organization';
import { generateAccessToken, generateRefreshToken, verifyToken } from '@/shared/utils/jwt';
import { TokenBlacklistService } from '@/shared/utils/tokenBlacklist';
import { AppError } from '@/shared/utils/AppError';
import { logger } from '@/shared/utils/logger';
import { EmailService } from '@/shared/utils/EmailService';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  MfaSetupResponse,
  OtpPasswordResetRequest,
  OtpPasswordResetResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  OtpSetPasswordRequest,
} from '../types';

/**
 * Authentication Service
 * Handles user authentication, password management, and MFA operations
 */
export class AuthService {
  /**
   * User login
   */
  static async login(loginData: LoginRequest): Promise<LoginResponse> {
    const { email, password, mfaToken } = loginData;

    logger.info('Login attempt', { email });

    // Find user with password field
    const user = await User.findOne({ email, isActive: true, isDeleted: false })
      .select('+password +mfaSecret');

    if (!user) {
      logger.warn('Login attempt with invalid email', { email });
      logger.debug('User lookup failed - no user found', { email, isActive: true, isDeleted: false });
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    logger.debug('User found in DB', { email, role: user.role, hasPassword: !!user.password, passwordLen: user.password?.length || 0 });

    // Store organizationId as string before any operations
    const organizationId = user.organizationId.toString();

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const lockTimeRemaining = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
      logger.warn('Login attempt on locked account', { email, lockTimeRemaining });
      throw new AppError(
        `Account is locked. Try again in ${lockTimeRemaining} minutes`,
        403,
        'ACCOUNT_LOCKED'
      );
    }

    // Verify password
    logger.debug('Starting password comparison', { email, storedHashLen: user.password.length, providedPassLen: password.length });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    logger.debug('Password comparison result', { email, isPasswordValid });

    if (!isPasswordValid) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1;

      // Lock account after 5 failed attempts for 15 minutes
      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await user.save();

      logger.warn('Failed login attempt', { email, attempts: user.failedLoginAttempts });
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Get organization to check MFA requirement
    const organization = await Organization.findById(user.organizationId);
    if (!organization) {
      throw new AppError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
    }

    // Check if organization subscription is active
    if (organization.subscription.status !== 'active') {
      throw new AppError('Organization subscription is not active', 403, 'SUBSCRIPTION_INACTIVE');
    }

    // Check MFA requirement
    const mfaRequired = organization.settings.securitySettings.mfaRequired || user.mfaEnabled;

    if (mfaRequired && !mfaToken) {
      logger.info('MFA required for login', { email });
      return {
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          organizationId,
        },
        accessToken: '',
        refreshToken: '',
        mfaRequired: true,
      };
    }

    // Verify MFA token if provided
    if (mfaRequired && mfaToken) {
      const isMfaValid = await this.verifyMfaToken(user, mfaToken);
      if (!isMfaValid) {
        logger.warn('Invalid MFA token', { email });
        throw new AppError('Invalid MFA token', 401, 'INVALID_MFA_TOKEN');
      }
    }

    // Reset failed login attempts on successful login
    user.failedLoginAttempts = 0;
    if (user.accountLockedUntil) {
      user.accountLockedUntil = null as any;
    }
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id,
      organizationId: user.organizationId,
      userRole: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id,
      organizationId: user.organizationId,
      userRole: user.role,
    });

    logger.info('User logged in successfully', {
      userId: user._id.toString(),
      email: user.email,
      organizationId,
    });

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        organizationId,
        mustChangePassword: !!user.mustChangePassword,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * User logout
   */
  static async logout(accessToken: string, refreshToken: string): Promise<void> {
    try {
      // Verify and decode tokens to get expiry times
      const accessTokenPayload = verifyToken(accessToken);
      const refreshTokenPayload = verifyToken(refreshToken);

      // Blacklist both tokens
      if (accessTokenPayload.exp) {
        TokenBlacklistService.blacklistToken(accessToken, accessTokenPayload.exp * 1000);
      }
      if (refreshTokenPayload.exp) {
        TokenBlacklistService.blacklistToken(refreshToken, refreshTokenPayload.exp * 1000);
      }

      logger.info('User logged out', {
        userId: accessTokenPayload.userId,
        organizationId: accessTokenPayload.organizationId,
      });
    } catch (error) {
      logger.error('Error during logout', error);
      throw new AppError('Logout failed', 500, 'LOGOUT_FAILED');
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(data: RefreshTokenRequest): Promise<{ accessToken: string }> {
    const { refreshToken } = data;

    // Check if token is blacklisted
    if (TokenBlacklistService.isTokenBlacklisted(refreshToken)) {
      throw new AppError('Token has been revoked', 401, 'TOKEN_REVOKED');
    }

    try {
      // Verify refresh token
      const payload = verifyToken(refreshToken);

      // Verify user still exists and is active
      const user = await User.findOne({
        _id: payload.userId,
        isActive: true,
        isDeleted: false,
      });

      if (!user) {
        throw new AppError('User not found or inactive', 401, 'USER_NOT_FOUND');
      }

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: user._id,
        organizationId: user.organizationId,
        userRole: user.role,
      });

      logger.info('Access token refreshed', {
        userId: user._id.toString(),
        organizationId: user.organizationId.toString(),
      });

      return { accessToken };
    } catch (error) {
      logger.error('Token refresh failed', error);
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    const { email } = data;

    const user = await User.findOne({ email, isActive: true, isDeleted: false });

    // Don't reveal if user exists for security
    if (!user) {
      logger.warn('Password reset requested for non-existent email', { email });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token and expiry (1 hour)
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    logger.info('Password reset token generated', {
      userId: user._id.toString(),
      email: user.email,
    });

    // TODO: Send email with reset token
    // In production, send email with link containing resetToken (not hashedToken)
    // For now, log it (only in development)
    if (process.env['NODE_ENV'] === 'development') {
      logger.debug('Password reset token (dev only)', { resetToken });
    }
  }

  /**
   * Confirm password reset
   */
  static async confirmPasswordReset(data: PasswordResetConfirmRequest): Promise<void> {
    const { token, newPassword } = data;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
      isActive: true,
      isDeleted: false,
    }).select('+password +passwordHistory');

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
    }

    // Check if new password matches any of the last 5 passwords
    if (user.passwordHistory && user.passwordHistory.length > 0) {
      for (const oldPassword of user.passwordHistory) {
        const isOldPassword = await bcrypt.compare(newPassword, oldPassword);
        if (isOldPassword) {
          throw new AppError(
            'Cannot reuse recent passwords',
            400,
            'PASSWORD_REUSE_NOT_ALLOWED'
          );
        }
      }
    }

    // Validate password strength (basic validation)
    if (newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400, 'WEAK_PASSWORD');
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.passwordResetToken = null as any;
    user.passwordResetExpires = null as any;
    user.lastPasswordChange = new Date();

    await user.save();

    logger.info('Password reset successful', {
      userId: user._id.toString(),
      email: user.email,
    });
  }

  /**
   * Setup MFA for user
   */
  static async setupMfa(userId: Types.ObjectId): Promise<MfaSetupResponse> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Generate MFA secret
    const secret = speakeasy.generateSecret({
      name: `Enterprise HRMS (${user.email})`,
      length: 32,
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Hash backup codes before storing
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    // Update user with MFA secret and backup codes
    await User.findByIdAndUpdate(userId, {
      mfaSecret: secret.base32,
      mfaBackupCodes: hashedBackupCodes,
      mfaEnabled: false, // Will be enabled after verification
    });

    // Generate QR code
    const qrCode = await qrcode.toDataURL(secret.otpauth_url!);

    logger.info('MFA setup initiated', {
      userId: user._id.toString(),
      email: user.email,
    });

    return {
      secret: secret.base32!,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Verify and enable MFA
   */
  static async verifyAndEnableMfa(userId: Types.ObjectId, token: string): Promise<void> {
    const user = await User.findById(userId).select('+mfaSecret');

    if (!user || !user.mfaSecret) {
      throw new AppError('MFA not set up', 400, 'MFA_NOT_SETUP');
    }

    // Verify token
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps in either direction
    });

    if (!isValid) {
      throw new AppError('Invalid MFA token', 400, 'INVALID_MFA_TOKEN');
    }

    // Enable MFA
    user.mfaEnabled = true;
    await user.save();

    logger.info('MFA enabled', {
      userId: user._id.toString(),
      email: user.email,
    });
  }

  /**
   * Disable MFA
   */
  static async disableMfa(userId: Types.ObjectId, password: string): Promise<void> {
    const user = await User.findById(userId).select('+password +mfaSecret');

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify password for security
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid password', 401, 'INVALID_PASSWORD');
    }

    // Disable MFA and clear secrets
    user.mfaEnabled = false;
    user.mfaSecret = null as any;
    user.mfaBackupCodes = [];
    await user.save();

    logger.info('MFA disabled', {
      userId: user._id.toString(),
      email: user.email,
    });
  }

  /**
   * Verify MFA token
   */
  private static async verifyMfaToken(user: IUser, token: string): Promise<boolean> {
    if (!user.mfaSecret) {
      return false;
    }

    // Try regular TOTP verification
    const isValidTotp = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (isValidTotp) {
      return true;
    }

    // Try backup codes
    if (user.mfaBackupCodes && user.mfaBackupCodes.length > 0) {
      for (let i = 0; i < user.mfaBackupCodes.length; i++) {
        const backupCode = user.mfaBackupCodes[i];
        if (!backupCode) continue;
        const isBackupCodeValid = await bcrypt.compare(token, backupCode);
        if (isBackupCodeValid) {
          // Remove used backup code
          user.mfaBackupCodes.splice(i, 1);
          await user.save();
          logger.info('Backup code used for login', {
            userId: user._id.toString(),
            remainingCodes: user.mfaBackupCodes.length,
          });
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Verify email address
   */
  static async verifyEmail(token: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400, 'INVALID_TOKEN');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null as any;
    user.emailVerificationExpires = null as any;
    await user.save();

    logger.info('Email verified', {
      userId: user._id.toString(),
      email: user.email,
    });
  }

  /**
   * Change password (for authenticated users)
   */
  static async changePassword(
    userId: Types.ObjectId,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+password +passwordHistory');

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD');
    }

    // Check if new password matches any of the last 5 passwords
    if (user.passwordHistory && user.passwordHistory.length > 0) {
      for (const oldPassword of user.passwordHistory) {
        const isOldPassword = await bcrypt.compare(newPassword, oldPassword);
        if (isOldPassword) {
          throw new AppError(
            'Cannot reuse recent passwords',
            400,
            'PASSWORD_REUSE_NOT_ALLOWED'
          );
        }
      }
    }

    // Validate password strength
    if (newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400, 'WEAK_PASSWORD');
    }

    // Update password
    user.password = newPassword;
    if (user.mustChangePassword) {
      user.mustChangePassword = false;
    }
    await user.save();

    logger.info('Password changed', {
      userId: user._id.toString(),
      email: user.email,
    });
  }

  /**
   * Request OTP for password reset / new employee account creation
   * Sends a 6-digit OTP to the email address
   */
  static async requestOtpPasswordReset(data: OtpPasswordResetRequest): Promise<OtpPasswordResetResponse> {
    const email = data.email.trim().toLowerCase();

    // Check if user exists
    let user = await User.findOne({ email, isDeleted: false });
    let isNewEmployee = false;

    if (!user) {
      // Check if there's an employee with this email but no user account
      const { EmployeeModel } = await import('@/domains/employees/models/Employee');
      const employee = await EmployeeModel.findOne({
        'personal.contact.email': email,
        isDeleted: { $ne: true },
      });

      if (!employee) {
        // Don't reveal if email doesn't exist (security)
        logger.warn('OTP requested for non-existent email', { email });
        return {
          message: 'If an account exists with this email, an OTP will be sent.',
          isNewEmployee: false,
          email,
        };
      }

      isNewEmployee = true;
      logger.info('OTP requested for new employee account', { email });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    if (user) {
      // Existing user - update OTP fields
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordResetToken: hashedOtp,
            passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          }
        }
      );
    } else {
      // Store OTP temporarily for new employee
      // We'll use a temporary collection or the employee record
      const { EmployeeModel } = await import('@/domains/employees/models/Employee');
      await EmployeeModel.updateOne(
        { 'personal.contact.email': email },
        {
          $set: {
            'onboarding.otpHash': hashedOtp,
            'onboarding.otpExpires': new Date(Date.now() + 10 * 60 * 1000),
          },
        }
      );
    }

    // Send email with OTP
    await EmailService.sendOtpEmail(email, otp, isNewEmployee);

    // For development convenience, still log it
    if (process.env['NODE_ENV'] === 'development') {
      console.log('\n========================================');
      console.log('📬 REAL EMAIL SENT (Check your Inbox)');
      console.log(`📧 To: ${email}`);
      console.log(`🔑 OTP: ${otp}`);
      console.log('========================================\n');
    }

    return {
      message: 'If an account exists with this email, an OTP will be sent.',
      isNewEmployee,
      email,
      // Include OTP in response for development testing only
      ...(process.env['NODE_ENV'] === 'development' ? { devOtp: otp } : {}),
    };
  }

  /**
   * Verify OTP
   */
  static async verifyOtp(data: OtpVerifyRequest): Promise<OtpVerifyResponse> {
    const email = data.email.trim().toLowerCase();
    const { otp } = data;

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    console.log('\n========================================');
    console.log('🔍 OTP VERIFICATION DEBUG');
    console.log(`📧 Email (Processed): ${email}`);
    console.log(`🔑 OTP provided: ${otp}`);
    console.log(`#️⃣ Hashed OTP: ${hashedOtp.substring(0, 20)}...`);
    console.log('========================================\n');

    // Check for existing user
    let user = await User.findOne({
      email,
      passwordResetToken: hashedOtp,
      passwordResetExpires: { $gt: new Date() },
      isDeleted: false,
    }).select('+passwordResetToken +passwordResetExpires');

    console.log('User found with matching OTP:', !!user);

    if (user) {
      // Generate reset token for password setting
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.passwordResetToken = hashedResetToken;
      user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes to set password
      await user.save();

      logger.info('OTP verified for existing user', { email });

      return {
        valid: true,
        resetToken,
        isNewEmployee: false,
      };
    }

    // Check for new employee
    const { EmployeeModel } = await import('@/domains/employees/models/Employee');
    const employee = await EmployeeModel.findOne({
      'personal.contact.email': email,
      'onboarding.otpHash': hashedOtp,
      'onboarding.otpExpires': { $gt: new Date() },
      isDeleted: { $ne: true },
    });

    if (employee) {
      // Generate reset token for account creation
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      employee.onboarding = employee.onboarding || { status: 'in_progress', steps: [] };
      (employee.onboarding as any).otpHash = hashedResetToken;
      (employee.onboarding as any).otpExpires = new Date(Date.now() + 15 * 60 * 1000);
      await employee.save();

      logger.info('OTP verified for new employee', { email });

      return {
        valid: true,
        resetToken,
        isNewEmployee: true,
      };
    }

    // DEBUG: If failed, try searching by email only to see what's in DB
    console.log('--- FAILED VERIFICATION DEBUG ---');
    const debugUser = await User.findOne({ email, isDeleted: false }).select('+passwordResetToken +passwordResetExpires');
    if (debugUser) {
      console.log('--- User Debug Info ---');
      console.log('Stored Token:', debugUser.passwordResetToken ? debugUser.passwordResetToken.substring(0, 20) + '...' : 'NONE');
      console.log('Target Token:', hashedOtp.substring(0, 20) + '...');
      console.log('Token Match:', debugUser.passwordResetToken === hashedOtp);
      console.log('Expires:', debugUser.passwordResetExpires);
      console.log('Now:', new Date());
    } else {
      console.log('User not found in DB with email:', email);
    }

    const { EmployeeModel: DebugEmployeeModel } = await import('@/domains/employees/models/Employee');
    const debugEmployee = await DebugEmployeeModel.findOne({ 'personal.contact.email': email, isDeleted: { $ne: true } });
    if (debugEmployee) {
      console.log('--- Employee Debug Info ---');
      const otpHash = (debugEmployee.onboarding as any)?.otpHash;
      const otpExpires = (debugEmployee.onboarding as any)?.otpExpires;
      console.log('Stored Token:', otpHash ? otpHash.substring(0, 20) + '...' : 'NONE');
      console.log('Target Token:', hashedOtp.substring(0, 20) + '...');
      console.log('Token Match:', otpHash === hashedOtp);
      console.log('Expires:', otpExpires);
    } else {
      console.log('Employee not found in DB with email:', email);
    }

    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  /**
   * Set password after OTP verification
   */
  static async setPasswordWithOtp(data: OtpSetPasswordRequest): Promise<void> {
    const email = data.email.trim().toLowerCase();
    const { resetToken, newPassword } = data;

    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Validate password strength
    if (newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400, 'WEAK_PASSWORD');
    }

    // Check for existing user
    let user = await User.findOne({
      email,
      passwordResetToken: hashedResetToken,
      passwordResetExpires: { $gt: new Date() },
      isDeleted: false,
    }).select('+password +passwordHistory +passwordResetToken +passwordResetExpires');

    if (user) {
      // Check password history
      if (user.passwordHistory && user.passwordHistory.length > 0) {
        for (const oldPassword of user.passwordHistory) {
          const isOldPassword = await bcrypt.compare(newPassword, oldPassword);
          if (isOldPassword) {
            throw new AppError('Cannot reuse recent passwords', 400, 'PASSWORD_REUSE_NOT_ALLOWED');
          }
        }
      }

      // Update password
      user.password = newPassword;
      user.passwordResetToken = null as any;
      user.passwordResetExpires = null as any;
      user.isEmailVerified = true;
      user.mustChangePassword = false;
      await user.save();

      logger.info('Password reset successful via OTP', { email });
      return;
    }

    // Check for new employee - create user account
    const { EmployeeModel } = await import('@/domains/employees/models/Employee');
    const employee = await EmployeeModel.findOne({
      'personal.contact.email': email,
      'onboarding.otpHash': hashedResetToken,
      'onboarding.otpExpires': { $gt: new Date() },
      isDeleted: { $ne: true },
    });

    if (!employee) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
    }

    // Create new user account for employee
    const newUser = new User({
      organizationId: employee.organizationId,
      email,
      password: newPassword,
      firstName: employee.personal.firstName,
      lastName: employee.personal.lastName,
      role: 'employee',
      employeeId: employee._id,
      isActive: true,
      isEmailVerified: true,
      mustChangePassword: false,
    });

    await newUser.save();

    // Link user to employee
    employee.userId = newUser._id;
    employee.onboarding = {
      ...employee.onboarding,
      status: 'completed',
    } as any;
    (employee.onboarding as any).otpHash = undefined;
    (employee.onboarding as any).otpExpires = undefined;
    await employee.save();

    logger.info('New employee account created via OTP', { email, userId: newUser._id.toString() });
  }
}
