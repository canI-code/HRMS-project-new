import { request } from "@/lib/api-client";
import type { AuthTokens } from "@/lib/auth/types";
import type { AuditLogEntry, AuditStats, RolePermissions, AdminUser } from "./types";

export const adminApi = {
  async listRoles(tokens: AuthTokens): Promise<{ roles: RolePermissions[] }> {
    return request<{ roles: RolePermissions[] }>("/admin/roles", {
      method: "GET",
      tokens,
    });
  },

  async listAuditLogs(tokens: AuthTokens, params?: { limit?: number; scope?: "org" | "all" }): Promise<{ logs: AuditLogEntry[] }> {
    const search = new URLSearchParams();
    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.scope) search.set("scope", params.scope);
    const query = search.toString();
    return request<{ logs: AuditLogEntry[] }>(`/admin/audit-logs${query ? `?${query}` : ""}`, {
      method: "GET",
      tokens,
    });
  },

  async auditStats(tokens: AuthTokens): Promise<AuditStats> {
    return request<AuditStats>("/admin/audit-logs/stats", {
      method: "GET",
      tokens,
    });
  },

  async listUsers(tokens: AuthTokens): Promise<{ users: AdminUser[] }> {
    return request<{ users: AdminUser[] }>("/admin/users", {
      method: "GET",
      tokens,
    });
  },

  async updateUser(tokens: AuthTokens, userId: string, updates: { role?: string; isActive?: boolean }): Promise<{ user: AdminUser }> {
    return request<{ user: AdminUser }>(`/admin/users/${userId}`, {
      method: "PATCH",
      tokens,
      body: updates,
    });
  },
};
