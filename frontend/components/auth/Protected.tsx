"use client";

import type { ReactNode } from "react";
import { useAuth } from "../../lib/auth/context";
import type { UserRole } from "../../lib/auth/types";

interface ProtectedProps {
  roles?: UserRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function Protected({ roles, fallback = null, children }: ProtectedProps) {
  const { state, hasRole } = useAuth();

  if (state.status !== "authenticated") {
    return <>{fallback}</>;
  }

  if (roles && !hasRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
