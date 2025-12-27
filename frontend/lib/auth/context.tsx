"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { request } from "../api-client";
import { clearAuthState, loadAuthState, persistAuthState } from "./storage";
import type {
  AuthContextValue,
  AuthState,
  AuthTokens,
  LoginPayload,
  LoginResponse,
  RefreshResponse,
  UserRole,
} from "./types";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const toTokens = (payload: { accessToken: string; refreshToken: string }): AuthTokens => ({
  accessToken: payload.accessToken,
  refreshToken: payload.refreshToken,
  // Default 15-minute expiry since backend doesn't return expiresIn
  expiresAt: Date.now() + 15 * 60 * 1000,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "unauthenticated", roles: [] });
  const tokensRef = useRef<AuthTokens | undefined>(undefined);

  useEffect(() => {
    const persisted = loadAuthState();
    if (persisted?.tokens) {
      tokensRef.current = persisted.tokens;
      setState({ status: "authenticated", tokens: persisted.tokens, roles: persisted.roles || [], user: persisted.user });
    }
  }, []);

  const persist = useCallback((next: AuthState) => {
    tokensRef.current = next.tokens;
    persistAuthState({ tokens: next.tokens, roles: next.roles, user: next.user });
  }, []);

  const logout = useCallback(() => {
    tokensRef.current = undefined;
    clearAuthState();
    setState({ status: "unauthenticated", roles: [] });
  }, []);

  const refreshTokens = useCallback(async (): Promise<AuthTokens | undefined> => {
    const current = tokensRef.current;
    if (!current?.refreshToken) return undefined;
    try {
      const response = await request<RefreshResponse>("/auth/refresh", {
        method: "POST",
        body: { refreshToken: current.refreshToken },
        skipAuth: true,
      });

      const tokens = toTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken || current.refreshToken,
      });

      const next: AuthState = {
        status: "authenticated",
        tokens,
        roles: response.user?.role ? [response.user.role] : state.roles,
        user: response.user ? { id: response.user.id, email: response.user.email, organizationId: response.user.organizationId } : state.user,
      };

      setState(next);
      persist(next);
      return tokens;
    } catch {
      logout();
      return undefined;
    }
  }, [logout, persist, state.roles, state.user]);

  useEffect(() => {
    if (!state.tokens) return;

    const id = window.setInterval(() => {
      const tokens = tokensRef.current;
      if (!tokens) return;
      const ttl = tokens.expiresAt - Date.now();

      // Refresh a minute before expiry, or immediately if expired.
      if (ttl <= 0 || ttl < 60_000) {
        refreshTokens();
      }
    }, 15_000);

    return () => window.clearInterval(id);
  }, [refreshTokens, state.tokens]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setState((prev) => ({ ...prev, status: "authenticating" }));
      const response = await request<LoginResponse>("/auth/login", {
        method: "POST",
        body: payload,
        skipAuth: true,
      });

      // Handle MFA required case
      if (response.mfaRequired) {
        throw new Error("MFA token required");
      }

      const tokens = toTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      const next: AuthState = {
        status: "authenticated",
        user: { id: response.user.id, email: response.user.email, organizationId: response.user.organizationId },
        roles: [response.user.role],
        tokens,
      };

      setState(next);
      persist(next);
    },
    [persist]
  );

  const setRoles = useCallback(
    (roles: UserRole[]) => {
      setState((prev) => {
        const next: AuthState = { ...prev, roles };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const hasRole = useCallback(
    (roles?: UserRole[]) => {
      if (!roles || roles.length === 0) return true;
      return roles.some((role) => state.roles.includes(role));
    },
    [state.roles]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ state, login, logout, refreshTokens, setRoles, hasRole }),
    [hasRole, login, logout, refreshTokens, setRoles, state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
