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

export interface MfaSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface MfaVerifyRequest {
  token: string;
  code: string;
}