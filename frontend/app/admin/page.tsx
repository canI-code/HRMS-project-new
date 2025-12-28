"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedPage } from "@/components/auth/ProtectedPage";
import { Protected } from "@/components/auth/Protected";
import { useAuth } from "@/lib/auth/context";
import { adminApi } from "@/lib/admin/api";
import type { RolePermissions, AuditLogEntry, AuditStats, AdminUser } from "@/lib/admin/types";
import { RolePermissionsPanel } from "@/components/admin/RolePermissionsPanel";
import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { UsersTable } from "@/components/admin/UsersTable";
import { env } from "@/lib/env";

export default function AdminPage() {
  const { state, refreshTokens, hasRole } = useAuth();
  const tokens = state.tokens;
  const [activeTab, setActiveTab] = useState<"organization" | "roles" | "audit" | "users">("organization");
  const [roles, setRoles] = useState<RolePermissions[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(100);
  const [scope, setScope] = useState<"org" | "all">("org");

  const canSeeAll = hasRole(["super_admin"]);
  const isSuperAdmin = hasRole(["super_admin"]);

  useEffect(() => {
    if (!tokens || state.status !== "authenticated") return;
    loadData();
  }, [tokens, state.status, limit, scope]);

  const ensureTokens = async () => {
    if (tokens) return tokens;
    const refreshed = await refreshTokens();
    if (!refreshed) throw new Error("Authentication required");
    return refreshed;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const nextTokens = await ensureTokens();

      const [roleResp, logResp, statsResp, usersResp] = await Promise.all([
        adminApi.listRoles(nextTokens),
        adminApi.listAuditLogs(nextTokens, { limit, scope: canSeeAll ? scope : "org" }),
        adminApi.auditStats(nextTokens),
        adminApi.listUsers(nextTokens),
      ]);

      setRoles(roleResp.roles || []);
      setLogs(logResp.logs || []);
      setStats(statsResp);
      setUsers(usersResp.users || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load admin data";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const orgSummary = useMemo(() => {
    return {
      organizationId: state.user?.organizationId || "unknown",
      environment: env.appEnv,
      apiBase: env.apiBaseUrl,
      userEmail: state.user?.email,
    };
  }, [state.user]);

  return (
    <ProtectedPage>
      <Protected roles={["super_admin", "hr_admin"]} fallback={<div className="p-6 text-sm text-red-700">Admin access required.</div>}>
        <AppShell>
          <div className="space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Admin</p>
                <h1 className="text-2xl font-semibold text-zinc-900">Admin Settings</h1>
                <p className="text-sm text-zinc-600">Organization overview, roles, and audit activity.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("organization")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "organization"
                      ? "bg-black text-white"
                      : "border border-zinc-200 text-zinc-800 hover:bg-zinc-100"
                  }`}
                >
                  Organization
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("roles")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "roles"
                      ? "bg-black text-white"
                      : "border border-zinc-200 text-zinc-800 hover:bg-zinc-100"
                  }`}
                >
                  Roles
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("audit")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "audit"
                      ? "bg-black text-white"
                      : "border border-zinc-200 text-zinc-800 hover:bg-zinc-100"
                  }`}
                >
                  Audit Logs
                </button>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("users")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      activeTab === "users"
                        ? "bg-black text-white"
                        : "border border-zinc-200 text-zinc-800 hover:bg-zinc-100"
                    }`}
                  >
                    Users
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}

            {activeTab === "organization" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-zinc-900">Organization</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Organization ID</p>
                      <p className="text-sm font-semibold text-zinc-900">{orgSummary.organizationId}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Environment</p>
                      <p className="text-sm font-semibold text-zinc-900">{orgSummary.environment}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">API Base</p>
                      <p className="text-sm font-semibold text-zinc-900">{orgSummary.apiBase}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Signed in</p>
                      <p className="text-sm font-semibold text-zinc-900">{orgSummary.userEmail}</p>
                    </div>
                  </div>
                </div>

                {stats && (
                  <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-zinc-900">Audit activity</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-zinc-500">Total logs</p>
                        <p className="text-2xl font-semibold text-zinc-900">{stats.totalLogs}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-zinc-500">Last hour</p>
                        <p className="text-2xl font-semibold text-zinc-900">{stats.recentActivity}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-zinc-500">Top resource</p>
                        <p className="text-sm font-semibold text-zinc-900">{Object.entries(stats.logsByResource)[0]?.[0] || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "roles" && <RolePermissionsPanel roles={roles} />}

            {activeTab === "audit" && (
              <AuditLogTable
                logs={logs}
                loading={loading}
                onRefresh={loadData}
                onChangeLimit={(val) => setLimit(Math.min(500, Math.max(10, val)))}
                limit={limit}
                canSeeAll={canSeeAll}
                scope={scope}
                onScopeChange={setScope}
              />
            )}

            {activeTab === "users" && tokens && (
              <UsersTable users={users} tokens={tokens} loading={loading} isSuperAdmin={isSuperAdmin} onRefresh={loadData} />
            )}

            </div>
          </AppShell>
        </Protected>
      </ProtectedPage>
    );
  }
