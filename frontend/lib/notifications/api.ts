import { request } from "../api-client";
import type { AuthTokens } from "../auth/types";
import type {
  NotificationLog,
  NotificationPreference,
  NotificationTemplate,
  NotificationSendPayload,
  UpdatePreferencesPayload,
} from "./types";

const buildCategoryQuery = (category?: string) => {
  if (!category) return "";
  const params = new URLSearchParams();
  params.set("category", category);
  return `?${params.toString()}`;
};

export const notificationApi = {
  async listTemplates(tokens: AuthTokens): Promise<NotificationTemplate[]> {
    return request<NotificationTemplate[]>("/notifications/templates", {
      method: "GET",
      tokens,
    });
  },

  async listLogs(tokens: AuthTokens, category?: string): Promise<NotificationLog[]> {
    const query = buildCategoryQuery(category);
    return request<NotificationLog[]>(`/notifications/logs${query}`, {
      method: "GET",
      tokens,
    });
  },

  async listMyLogs(tokens: AuthTokens, category?: string): Promise<NotificationLog[]> {
    const query = buildCategoryQuery(category);
    return request<NotificationLog[]>(`/notifications/logs/mine${query}`, {
      method: "GET",
      tokens,
    });
  },

  async getPreferences(tokens: AuthTokens): Promise<NotificationPreference> {
    return request<NotificationPreference>("/notifications/preferences", {
      method: "GET",
      tokens,
    });
  },

  async updatePreferences(
    payload: UpdatePreferencesPayload,
    tokens: AuthTokens
  ): Promise<NotificationPreference> {
    return request<NotificationPreference>("/notifications/preferences", {
      method: "PATCH",
      body: payload,
      tokens,
    });
  },

  async send(payload: NotificationSendPayload, tokens: AuthTokens): Promise<{ deliveries: number }> {
    return request<{ deliveries: number }>("/notifications/send", {
      method: "POST",
      body: payload,
      tokens,
    });
  },

  async createTemplate(payload: any, tokens: AuthTokens): Promise<NotificationTemplate> {
    return request<NotificationTemplate>("/notifications/templates", {
      method: "POST",
      body: payload,
      tokens,
    });
  },
};
