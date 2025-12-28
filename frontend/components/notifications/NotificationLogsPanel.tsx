"use client";

import { useMemo } from "react";
import type { NotificationLog } from "@/lib/notifications/types";

interface NotificationLogsPanelProps {
  logs: NotificationLog[];
  loading: boolean;
  view: "mine" | "all";
  categories: string[];
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  onRefresh: () => void;
}

const statusBadge = (status: NotificationLog["status"]) => {
  return status === "sent"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-amber-100 text-amber-700";
};

const channelLabel = (channel: string) => channel.replace("_", " ");

export function NotificationLogsPanel({
  logs,
  loading,
  view,
  categories,
  categoryFilter,
  onCategoryChange,
  onRefresh,
}: NotificationLogsPanelProps) {
  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [logs]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">{view === "mine" ? "My notifications" : "All notifications"}</h3>
          <p className="text-sm text-zinc-600">Latest deliveries and skips.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
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
          <div className="p-6 text-sm text-zinc-600">Loading notifications...</div>
        ) : sortedLogs.length === 0 ? (
          <div className="p-6 text-sm text-zinc-600">No notification events found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Channel</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Reason</th>
                  {view === "all" && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">User</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {sortedLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-sm text-zinc-800">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm capitalize text-zinc-700">{channelLabel(log.channel)}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700">{log.category}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(log.status)}`}>
                        {log.status === "sent" ? "Sent" : "Skipped"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">{log.reason || "-"}</td>
                    {view === "all" && (
                      <td className="px-4 py-3 text-sm text-zinc-600">{log.userId}</td>
                    )}
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
