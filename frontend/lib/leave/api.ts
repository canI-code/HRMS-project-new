import { request } from "../api-client";
import type { AuthTokens } from "../auth/types";
import type {
  LeaveRecord,
  CreateLeavePayload,
  ApproveLeavePayload,
  RejectLeavePayload,
  CancelLeavePayload,
  LeaveListQuery,
} from "./types";

export const leaveApi = {
  async requestLeave(payload: CreateLeavePayload, tokens: AuthTokens): Promise<LeaveRecord> {
    return request<LeaveRecord>("/leaves", {
      method: "POST",
      tokens,
      body: payload,
    });
  },

  async listLeaves(query: LeaveListQuery, tokens: AuthTokens): Promise<LeaveRecord[]> {
    const params = new URLSearchParams();
    if (query.status) params.append("status", query.status);
    if (query.employeeId) params.append("employeeId", query.employeeId);
    if (query.leaveType) params.append("leaveType", query.leaveType);
    if (query.showAll) params.append("showAll", "true");

    const queryString = params.toString();
    const path = `/leaves${queryString ? `?${queryString}` : ""}`;

    return request<LeaveRecord[]>(path, {
      method: "GET",
      tokens,
    });
  },

  async getLeaveById(leaveId: string, tokens: AuthTokens): Promise<LeaveRecord> {
    return request<LeaveRecord>(`/leaves/${leaveId}`, {
      method: "GET",
      tokens,
    });
  },

  async approveLeave(leaveId: string, payload: ApproveLeavePayload, tokens: AuthTokens): Promise<LeaveRecord> {
    return request<LeaveRecord>(`/leaves/${leaveId}/approve`, {
      method: "POST",
      tokens,
      body: payload,
    });
  },

  async rejectLeave(leaveId: string, payload: RejectLeavePayload, tokens: AuthTokens): Promise<LeaveRecord> {
    return request<LeaveRecord>(`/leaves/${leaveId}/reject`, {
      method: "POST",
      tokens,
      body: payload,
    });
  },

  async cancelLeave(leaveId: string, payload: CancelLeavePayload, tokens: AuthTokens): Promise<LeaveRecord> {
    return request<LeaveRecord>(`/leaves/${leaveId}/cancel`, {
      method: "POST",
      tokens,
      body: payload,
    });
  },

  // Policy Management
  async getPolicy(tokens: AuthTokens): Promise<{ allocations: { leaveType: string; totalDays: number }[] }> {
    return request("/leaves/policy", {
      method: "GET",
      tokens,
    });
  },

  async updatePolicy(payload: { allocations: { leaveType: string; totalDays: number }[] }, tokens: AuthTokens): Promise<any> {
    return request("/leaves/policy", {
      method: "POST",
      tokens,
      body: payload,
    });
  },

  async getBalances(tokens: AuthTokens): Promise<{ leaveType: string; total: number; used: number; available: number }[]> {
    return request("/leaves/balance", {
      method: "GET",
      tokens,
    });
  },
};

