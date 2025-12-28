import { request } from "../api-client";
import type { AuthTokens } from "../auth/types";
import type {
  AttendanceRecord,
  MonthlyAttendanceResponse,
  AttendancePolicy,
  UpsertPolicyPayload,
} from "./types";

export const attendanceApi = {
  async checkIn(employeeId: string, tokens: AuthTokens, checkInTime?: string): Promise<AttendanceRecord> {
    return request<AttendanceRecord>("/attendance/check-in", {
      method: "POST",
      tokens,
      body: { employeeId, ...(checkInTime ? { checkInTime } : {}) },
    });
  },

  async checkOut(
    employeeId: string,
    tokens: AuthTokens,
    params?: { checkOutTime?: string; breakMinutes?: number }
  ): Promise<AttendanceRecord> {
    return request<AttendanceRecord>("/attendance/check-out", {
      method: "POST",
      tokens,
      body: {
        employeeId,
        ...(params?.checkOutTime ? { checkOutTime: params.checkOutTime } : {}),
        ...(typeof params?.breakMinutes === "number" ? { breakMinutes: params.breakMinutes } : {}),
      },
    });
  },

  async markAbsent(employeeId: string, date: string, tokens: AuthTokens, notes?: string): Promise<AttendanceRecord> {
    return request<AttendanceRecord>("/attendance/mark-absent", {
      method: "POST",
      tokens,
      body: { employeeId, date, ...(notes ? { notes } : {}) },
    });
  },

  async getByDate(employeeId: string, date: string, tokens: AuthTokens): Promise<AttendanceRecord> {
    const params = new URLSearchParams();
    params.append("date", date);
    return request<AttendanceRecord>(`/attendance/${employeeId}/date?${params.toString()}`, {
      method: "GET",
      tokens,
    });
  },

  async getMonthly(employeeId: string, tokens: AuthTokens, year?: number, month?: number): Promise<MonthlyAttendanceResponse> {
    const now = new Date();
    const y = year ?? now.getFullYear();
    const m = month ?? now.getMonth() + 1;
    const params = new URLSearchParams();
    params.append("year", String(y));
    params.append("month", String(m));
    return request<MonthlyAttendanceResponse>(`/attendance/${employeeId}/monthly?${params.toString()}`, {
      method: "GET",
      tokens,
    });
  },

  async upsertPolicy(payload: UpsertPolicyPayload, tokens: AuthTokens): Promise<AttendancePolicy> {
    return request<AttendancePolicy>("/attendance/policy", {
      method: "POST",
      tokens,
      body: payload,
    });
  },
};
