import { UserRole } from '@/shared/types/common';

export interface LoginRequest {
  email: string;
  password: string;
  mfaToken?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: UserRole;
    organizationId: string;
    mustChangePassword?: boolean;
  };
  accessToken: string;
  refreshToken: string;
  mfaRequired?: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

// OTP Password Reset Types
export interface OtpPasswordResetRequest {
  email: string;
}

export interface OtpPasswordResetResponse {
  message: string;
  isNewEmployee: boolean;
  email: string;
}

export interface OtpVerifyRequest {
  email: string;
  otp: string;
}

export interface OtpVerifyResponse {
  valid: boolean;
  resetToken: string;
  isNewEmployee: boolean;
}

export interface OtpSetPasswordRequest {
  email: string;
  resetToken: string;
  newPassword: string;
}

export interface MfaSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface MfaVerifyRequest {
  token: string;
  code: string;
}