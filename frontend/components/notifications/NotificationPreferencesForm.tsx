"use client";

import { useEffect, useMemo, useState } from "react";
import type { NotificationChannel, NotificationPreference, UpdatePreferencesPayload } from "@/lib/notifications/types";

interface NotificationPreferencesFormProps {
  preferences: NotificationPreference | null;
  categories: string[];
  saving: boolean;
  onSave: (payload: UpdatePreferencesPayload) => Promise<void> | void;
}

const CHANNELS: NotificationChannel[] = ["email", "sms", "push", "in_app"];

export function NotificationPreferencesForm({ preferences, categories, saving, onSave }: NotificationPreferencesFormProps) {
  const [enabledChannels, setEnabledChannels] = useState<NotificationChannel[]>(CHANNELS);
  const [mutedCategories, setMutedCategories] = useState<string[]>([]);
  const [optOutAll, setOptOutAll] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (!preferences) return;
    setEnabledChannels(preferences.enabledChannels);
    setMutedCategories(preferences.mutedCategories);
    setOptOutAll(preferences.optOutAll);
  }, [preferences]);

  const availableCategorySuggestions = useMemo(
    () => categories.filter((cat) => !mutedCategories.includes(cat)),
    [categories, mutedCategories]
  );

  const toggleChannel = (channel: NotificationChannel) => {
    setEnabledChannels((prev) => {
      if (prev.includes(channel)) {
        return prev.filter((c) => c !== channel);
      }
      return [...prev, channel];
    });
  };

  const addCategory = (category: string) => {
    const normalized = category.trim();
    if (!normalized) return;
    setMutedCategories((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    setNewCategory("");
  };

  const removeCategory = (category: string) => {
    setMutedCategories((prev) => prev.filter((c) => c !== category));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ enabledChannels, mutedCategories, optOutAll });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Channels</h3>
            <p className="text-sm text-zinc-600">Choose how you prefer to be reached.</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300"
              checked={optOutAll}
              onChange={(e) => setOptOutAll(e.target.checked)}
            />
            Pause all notifications
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {CHANNELS.map((channel) => (
            <label key={channel} className="flex items-start gap-3 rounded-lg border border-zinc-200 p-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-zinc-300"
                checked={enabledChannels.includes(channel) && !optOutAll}
                disabled={optOutAll}
                onChange={() => toggleChannel(channel)}
              />
              <div className="space-y-1">
                <p className="text-sm font-semibold capitalize text-zinc-900">{channel.replace("_", " ")}</p>
                <p className="text-xs text-zinc-600">Enable delivery via {channel.replace("_", " ")}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Muted categories</h3>
            <p className="text-sm text-zinc-600">Silence specific notification categories.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add category"
              className="w-40 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
            <button
              type="button"
              onClick={() => addCategory(newCategory)}
              className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Add
            </button>
          </div>
        </div>

        {availableCategorySuggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600">
            {availableCategorySuggestions.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => addCategory(cat)}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 transition hover:bg-zinc-100"
              >
                Mute {cat}
              </button>
            ))}
          </div>
        )}

        {mutedCategories.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600">No muted categories.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {mutedCategories.map((category) => (
              <span
                key={category}
                className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-800"
              >
                {category}
                <button
                  type="button"
                  onClick={() => removeCategory(category)}
                  className="text-xs text-zinc-500 hover:text-zinc-800"
                  aria-label={`Unmute ${category}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !preferences}
          className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {saving ? "Saving..." : "Save preferences"}
        </button>
      </div>
    </form>
  );
}
