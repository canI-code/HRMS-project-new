import { request } from "../api-client";
import type { AuthTokens } from "../auth/types";

export type ConfigItemType = 'department' | 'title' | 'location';

export interface ConfigItem {
    _id: string;
    organizationId: string;
    type: ConfigItemType;
    value: string;
    label: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateConfigItemPayload {
    label: string;
    value?: string;
    sortOrder?: number;
}

export interface UpdateConfigItemPayload {
    label?: string;
    isActive?: boolean;
    sortOrder?: number;
}

export const configApi = {
    async list(type: ConfigItemType, tokens: AuthTokens, includeInactive = false): Promise<ConfigItem[]> {
        const query = includeInactive ? '?includeInactive=true' : '';
        return request<ConfigItem[]>(`/admin/config/${type}${query}`, {
            method: 'GET',
            tokens,
        });
    },

    async create(type: ConfigItemType, payload: CreateConfigItemPayload, tokens: AuthTokens): Promise<ConfigItem> {
        return request<ConfigItem>(`/admin/config/${type}`, {
            method: 'POST',
            body: payload,
            tokens,
        });
    },

    async update(type: ConfigItemType, id: string, payload: UpdateConfigItemPayload, tokens: AuthTokens): Promise<ConfigItem> {
        return request<ConfigItem>(`/admin/config/${type}/${id}`, {
            method: 'PATCH',
            body: payload,
            tokens,
        });
    },

    async delete(type: ConfigItemType, id: string, tokens: AuthTokens, hard = false): Promise<void> {
        const query = hard ? '?hard=true' : '';
        await request(`/admin/config/${type}/${id}${query}`, {
            method: 'DELETE',
            tokens,
        });
    },

    async seed(tokens: AuthTokens): Promise<void> {
        await request('/admin/config/seed', {
            method: 'POST',
            tokens,
        });
    },
};
