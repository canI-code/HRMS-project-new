"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../lib/auth/context";
import { employeeApi } from "../../../lib/employees/api";
import type { Employee } from "../../../lib/employees/types";
import { attendanceApi } from "../../../lib/attendance/api";
import type { MonthlyAttendanceResponse } from "../../../lib/attendance/types";

export default function MonthlyAttendancePage() {
  const { state, refreshTokens } = useAuth();
  const tokens = state.tokens!;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MonthlyAttendanceResponse | null>(null);

  useEffect(() => {
    async function loadEmployees() {
      try {
        if (state.roles.includes("employee")) {
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

  const canFetch = useMemo(() => !!employeeId && !loading, [employeeId, loading]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const r = await attendanceApi.getMonthly(employeeId, tokens, year, month);
      setData(r);
    } catch (err) {
      try {
        const next = await refreshTokens();
        if (next) {
          const r = await attendanceApi.getMonthly(employeeId, next, year, month);
          setData(r);
        } else {
          throw err;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch monthly attendance");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, year, month]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Monthly Attendance</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm">Employee</span>
          <select className="mt-1 w-full border rounded p-2" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} disabled={state.roles.includes("employee")}>
            <option value="">Select employee</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                {e.personal.firstName} {e.personal.lastName} ({e.employeeCode})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm">Year</span>
          <input type="number" className="mt-1 w-full border rounded p-2" value={year} onChange={(e) => setYear(parseInt(e.target.value || "0", 10))} />
        </label>
        <label className="block">
          <span className="text-sm">Month</span>
          <input type="number" min={1} max={12} className="mt-1 w-full border rounded p-2" value={month} onChange={(e) => setMonth(parseInt(e.target.value || "1", 10))} />
        </label>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Total Days" value={data.summary.totalDays} />
            <Stat label="Present" value={data.summary.presentDays} />
            <Stat label="Absent" value={data.summary.absentDays} />
            <Stat label="Late" value={data.summary.lateDays} />
            <Stat label="Half Days" value={data.summary.halfDays} />
            <Stat label="Working Minutes" value={data.summary.totalWorkingMinutes} />
            <Stat label="Overtime Minutes" value={data.summary.totalOvertimeMinutes} />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Check In</th>
                  <th className="px-3 py-2 text-left">Check Out</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Working</th>
                  <th className="px-3 py-2 text-left">Overtime</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="px-3 py-2">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "-"}</td>
                    <td className="px-3 py-2">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "-"}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">{r.workingMinutes ?? 0}</td>
                    <td className="px-3 py-2">{r.overtimeMinutes ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded p-3">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-lg font-medium">{value}</div>
    </div>
  );
}
