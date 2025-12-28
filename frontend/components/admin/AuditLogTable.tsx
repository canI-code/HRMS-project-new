"use client";

import type { AuditLogEntry } from "@/lib/admin/types";

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  loading: boolean;
  onRefresh: () => void;
  onChangeLimit: (limit: number) => void;
  limit: number;
  canSeeAll: boolean;
  scope: "org" | "all";
  onScopeChange: (scope: "org" | "all") => void;
}

const statusBadge = (success: boolean) =>
  success ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700";

export function AuditLogTable({
  logs,
  loading,
  onRefresh,
  onChangeLimit,
  limit,
  canSeeAll,
  scope,
  onScopeChange,
}: AuditLogTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Audit logs</p>
          <p className="text-xs text-zinc-600">Most recent actions recorded by the platform.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-1">
            Limit
            <input
              type="number"
              min={10}
              max={500}
              value={limit}
              onChange={(e) => onChangeLimit(Number(e.target.value) || 50)}
              className="w-20 rounded-lg border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-zinc-400"
            />
          </label>
          {canSeeAll && (
            <select
              value={scope}
              onChange={(e) => onScopeChange(e.target.value as "org" | "all")}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            >
              <option value="org">This org</option>
              <option value="all">All orgs</option>
            </select>
          )}
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-6 text-sm text-zinc-600">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-sm text-zinc-600">No audit entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Outcome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Request</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {logs.map((log) => (
                  <tr key={log._id || `${log.metadata.requestId}-${log.metadata.timestamp}` } className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-sm text-zinc-800">{new Date(log.metadata.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700">{log.userId}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700">{log.resource}{log.resourceId ? ` (${log.resourceId})` : ""}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700">{log.action}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(log.success)}`}>
                        {log.success ? "Success" : "Failed"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">{log.metadata.method} {log.metadata.url}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600">{log.errorMessage || log.metadata.requestId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
