import type { UserRole } from "@/lib/auth/types";

export interface AdminPermission {
  resource: string;
  action: string;
  minRole: UserRole;
  allowSelfAccess?: boolean;
  organizationBoundary?: boolean;
}

export interface RolePermissions {
  role: UserRole;
  permissions: AdminPermission[];
}

export interface AuditLogMeta {
  ipAddress: string;
  userAgent: string;
  requestId: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode?: number;
  duration?: number;
}

export interface AuditLogEntry {
  _id?: string;
  organizationId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: {
    before?: unknown;
    after?: unknown;
    fields?: string[];
  };
  metadata: AuditLogMeta;
  success: boolean;
  errorMessage?: string;
}

export interface AuditStats {
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsByResource: Record<string, number>;
  recentActivity: number;
}

export interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}
