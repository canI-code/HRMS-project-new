import { useMemo, useState } from "react";
import type { NotificationTemplate, CreateTemplatePayload } from "@/lib/notifications/types";
import { CreateTemplateDialog } from "./CreateTemplateDialog";
import { TemplateGuide } from "./TemplateGuide";
import { notificationApi } from "@/lib/notifications/api";
import { useAuth } from "@/lib/auth/context";
import { BookOpen } from "lucide-react";

interface NotificationTemplatesListProps {
  templates: NotificationTemplate[];
  onRefresh?: () => void;
}

const channelLabel = (channel: string) => channel.replace("_", " ");

export function NotificationTemplatesList({ templates, onRefresh }: NotificationTemplatesListProps) {
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const { state } = useAuth();
  const tokens = state.tokens;

  const handleCreateTemplate = async (payload: CreateTemplatePayload) => {
    if (!tokens) return;
    try {
      await notificationApi.createTemplate(payload, tokens);
      setShowCreateDialog(false);
      onRefresh?.();
    } catch (error) {
      console.error("Failed to create template:", error);
      alert("Failed to create template");
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return templates;
    return templates.filter((tpl) =>
      tpl.name.toLowerCase().includes(query) || tpl.category.toLowerCase().includes(query)
    );
  }, [search, templates]);

  return (
    <div className="space-y-4">
      {showGuide && <TemplateGuide />}

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Templates</p>
            <p className="text-xs text-zinc-600">Active notification templates available to workflows.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or category"
              className="w-52 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition flex items-center gap-2 ${showGuide ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
            >
              <BookOpen className="h-4 w-4" />
              Guide
            </button>
            <button
              type="button"
              onClick={() => setShowCreateDialog(true)}
              className="rounded-lg border border-zinc-200 bg-black text-white px-3 py-2 text-sm font-semibold transition hover:opacity-90"
            >
              Create Template
            </button>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
              >
                Refresh
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6 text-sm text-zinc-600">No templates found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Channel</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Placeholders</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filtered.map((tpl) => (
                  <tr key={tpl._id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-sm font-semibold text-zinc-900">{tpl.name}</td>
                    <td className="px-4 py-3 text-sm capitalize text-zinc-700">{channelLabel(tpl.channel)}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700">{tpl.category}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700">{tpl.placeholders?.length || 0}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600">{new Date(tpl.updatedAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${tpl.active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                          }`}
                      >
                        {tpl.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {showCreateDialog && (
          <CreateTemplateDialog
            onClose={() => setShowCreateDialog(false)}
            onSuccess={handleCreateTemplate}
          />
        )}
      </div>
    </div>
  );
}
