export type UserRole = "super_admin" | "hr_admin" | "manager" | "employee";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  organizationId: string; // Add organizationId
  mustChangePassword?: boolean;
}

export type AuthStatus = "unauthenticated" | "authenticating" | "authenticated" | "loading";

export interface AuthState {
  status: AuthStatus;
  user?: AuthUser;
  roles: UserRole[];
  tokens?: AuthTokens;
}

export interface LoginPayload {
  email: string;
  password: string;
  mfaToken?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    organizationId: string;
    mustChangePassword?: boolean;
  };
  mfaRequired?: boolean;
}

export interface RefreshResponse {
  accessToken: string;

  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    organizationId: string;
  };
}

export interface AuthContextValue {
  state: AuthState;
  login: (payload: LoginPayload) => Promise<LoginResponse>;
  logout: () => void;
  refreshTokens: () => Promise<AuthTokens | undefined>;
  setRoles: (roles: UserRole[]) => void;
  hasRole: (roles?: UserRole[]) => boolean;
}
