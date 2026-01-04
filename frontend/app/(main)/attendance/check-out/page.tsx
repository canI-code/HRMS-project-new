"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { employeeApi } from "@/lib/employees/api";
import type { Employee } from "@/lib/employees/types";
import { attendanceApi } from "@/lib/attendance/api";
import type { AttendanceRecord } from "@/lib/attendance/types";

export default function CheckOutPage() {
  const { state, refreshTokens } = useAuth();
  const tokens = state.tokens!;
  const isPrivileged = state.roles.includes("super_admin") || state.roles.includes("hr_admin");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AttendanceRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEmployees() {
      try {
        // Only super_admin/hr_admin can act on others. Everyone else is limited to their own profile.
        if (!isPrivileged) {
          const me = await employeeApi.me(tokens);
          setEmployees([me]);
          setEmployeeId(me._id);
          return;
        }

        const res = await employeeApi.list({ limit: 100 }, tokens);
        setEmployees(res.employees);
        const mine = res.employees.find((e) => e.userId === state.user?.id);
        if (mine) setEmployeeId(mine._id);
      } catch (e) {
        try {
          const me = await employeeApi.me(tokens);
          setEmployees([me]);
          setEmployeeId(me._id);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load employees");
        }
      }
    }
    loadEmployees();
  }, [tokens, state.roles, state.user?.id]);

  const canSubmit = useMemo(() => !!employeeId && !loading, [employeeId, loading]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await attendanceApi.checkOut(employeeId, tokens, {});
      setResult(r);
    } catch (err) {
      try {
        const next = await refreshTokens();
        if (next) {
          const r = await attendanceApi.checkOut(employeeId, next, {});
          setResult(r);
        } else {
          throw err;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Check-out failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Check Out</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm">Employee</span>
          <select
            className="mt-1 w-full border rounded p-2"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            disabled={!isPrivileged}
          >
            <option value="">Select employee</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                {e.personal.firstName} {e.personal.lastName} ({e.employeeCode})
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={!canSubmit} className="btn btn-secondary">
          {loading ? "Checking out..." : "Check Out"}
        </button>
      </form>

      {error && <p className="text-red-600">{error}</p>}
      {result && (
        <div className="mt-4 border rounded p-3">
          <p>Checked out at: {result.checkOut ? new Date(result.checkOut).toLocaleString() : "-"}</p>
          <p>Worked: {result.workingMinutes ?? 0} minutes</p>
          <p>Overtime: {result.overtimeMinutes ?? 0} minutes</p>
          <p>Status: {result.status}</p>
        </div>
      )}
    </div>
  );
}
