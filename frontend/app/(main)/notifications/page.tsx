"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { notificationApi } from "@/lib/notifications/api";
import type {
  NotificationLog,
  NotificationPreference,
  NotificationTemplate,
  UpdatePreferencesPayload,
} from "@/lib/notifications/types";
import { NotificationLogsPanel } from "@/components/notifications/NotificationLogsPanel";
import { NotificationPreferencesForm } from "@/components/notifications/NotificationPreferencesForm";
import { NotificationTemplatesList } from "@/components/notifications/NotificationTemplatesList";

export default function NotificationsPage() {
  const { state, refreshTokens, hasRole } = useAuth();
  const tokens = state.tokens;
  const isAuthenticated = state.status === "authenticated";
  const canViewAll = hasRole(["super_admin", "hr_admin", "manager"]);

  const [activeTab, setActiveTab] = useState<"feed" | "preferences" | "templates">("feed");
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const combined = new Set<string>();
    templates.forEach((tpl) => combined.add(tpl.category));
    logs.forEach((log) => combined.add(log.category));
    return Array.from(combined);
  }, [logs, templates]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadAll();
  }, [isAuthenticated, categoryFilter, canViewAll, tokens]);

  const ensureTokens = async () => {
    if (tokens) return tokens;
    const refreshed = await refreshTokens();
    if (!refreshed) {
      throw new Error("Authentication required");
    }
    return refreshed;
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const nextTokens = await ensureTokens();

      const [prefs, tpl, fetchedLogs] = await Promise.all([
        notificationApi.getPreferences(nextTokens),
        notificationApi.listTemplates(nextTokens),
        canViewAll
          ? notificationApi.listLogs(nextTokens, categoryFilter)
          : notificationApi.listMyLogs(nextTokens, categoryFilter),
      ]);

      setPreferences(prefs);
      setTemplates(tpl);
      setLogs(fetchedLogs);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load notifications";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async (payload: UpdatePreferencesPayload) => {
    try {
      setSavingPrefs(true);
      const nextTokens = await ensureTokens();
      const updated = await notificationApi.updatePreferences(payload, nextTokens);
      setPreferences(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update preferences";
      setError(message);
    } finally {
      setSavingPrefs(false);
    }
  };

  const myView = canViewAll ? "all" : "mine";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Notifications</p>
          <h1 className="text-2xl font-semibold text-zinc-900">Notification Center</h1>
          <p className="text-sm text-zinc-600">View deliveries, manage templates, and control your preferences.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("feed")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === "feed" ? "bg-black text-white" : "border border-zinc-200 text-zinc-800 hover:bg-zinc-100"
              }`}
          >
            Feed
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === "preferences"
                ? "bg-black text-white"
                : "border border-zinc-200 text-zinc-800 hover:bg-zinc-100"
              }`}
          >
            Preferences
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === "templates"
                ? "bg-black text-white"
                : "border border-zinc-200 text-zinc-800 hover:bg-zinc-100"
              }`}
          >
            Templates
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {activeTab === "feed" && (
        <NotificationLogsPanel
          logs={logs}
          loading={loading}
          view={myView}
          categories={categories}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          onRefresh={loadAll}
        />
      )}

      {activeTab === "preferences" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            Adjust your personal delivery rules. Preferences are enforced when workflows dispatch notifications to you.
          </div>
          {!preferences && loading ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">Loading preferences...</div>
          ) : (
            <NotificationPreferencesForm
              preferences={preferences}
              categories={categories}
              saving={savingPrefs}
              onSave={handleSavePreferences}
            />
          )}
        </div>
      )}

      {activeTab === "templates" && (
        <NotificationTemplatesList templates={templates} onRefresh={loadAll} />
      )}
    </div>
  );
}
