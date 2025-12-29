"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { payrollApi } from "@/lib/payroll/api";
import type { PayrollSummary, DepartmentReport } from "@/lib/payroll/types";
import { Protected } from "@/components/auth/Protected";
import { AppShell } from "@/components/layout/AppShell"; // Keep strict layout if needed or remove. Actually remove it.

export default function PayrollReportsPage() {
  const { state } = useAuth();
  const tokens = state.tokens;

  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [departmentReport, setDepartmentReport] = useState<DepartmentReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadReports = async () => {
    if (!tokens) return;

    try {
      setLoading(true);
      setError(null);

      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const [summaryData, deptData] = await Promise.all([
        payrollApi.getPayrollSummary(tokens, params),
        payrollApi.getDepartmentReport(tokens, params),
      ]);

      setSummary(summaryData);
      setDepartmentReport(deptData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load reports";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [tokens]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  return (
    <Protected roles={["hr_admin", "super_admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll Reports</h1>
          <p className="text-muted-foreground">View summary and department-wise payroll analytics</p>
        </div>

        {/* Date Filters */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <button
              onClick={loadReports}
              disabled={loading}
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Apply Filters"}
            </button>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setTimeout(loadReports, 50);
                }}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {/* Summary Section */}
        {summary && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Summary</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Total Runs</p>
                <p className="text-2xl font-semibold text-zinc-900">{summary.totalRuns}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Total Payslips</p>
                <p className="text-2xl font-semibold text-zinc-900">{summary.totalPayslips}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Total Gross</p>
                <p className="text-2xl font-semibold text-zinc-900">{formatCurrency(summary.totalGross)}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Total Net</p>
                <p className="text-2xl font-semibold text-zinc-900">{formatCurrency(summary.totalNet)}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Total Deductions</p>
                <p className="text-2xl font-semibold text-zinc-900">{formatCurrency(summary.totalDeductions)}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Avg Gross</p>
                <p className="text-2xl font-semibold text-zinc-900">{formatCurrency(summary.averageGross)}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Avg Net</p>
                <p className="text-2xl font-semibold text-zinc-900">{formatCurrency(summary.averageNet)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Department Report */}
        {departmentReport.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 p-4">
              <h2 className="text-lg font-semibold text-zinc-900">Department-wise Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="px-4 py-3 text-left font-semibold text-zinc-900">Department</th>
                    <th className="px-4 py-3 text-right font-semibold text-zinc-900">Employees</th>
                    <th className="px-4 py-3 text-right font-semibold text-zinc-900">Total Gross</th>
                    <th className="px-4 py-3 text-right font-semibold text-zinc-900">Total Deductions</th>
                    <th className="px-4 py-3 text-right font-semibold text-zinc-900">Total Net</th>
                    <th className="px-4 py-3 text-right font-semibold text-zinc-900">Avg Gross</th>
                    <th className="px-4 py-3 text-right font-semibold text-zinc-900">Avg Net</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentReport.map((dept, idx) => (
                    <tr key={idx} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{dept.department}</td>
                      <td className="px-4 py-3 text-right text-zinc-600">{dept.employeeCount}</td>
                      <td className="px-4 py-3 text-right text-zinc-900">{formatCurrency(dept.totalGross)}</td>
                      <td className="px-4 py-3 text-right text-zinc-600">{formatCurrency(dept.totalDeductions)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-zinc-900">{formatCurrency(dept.totalNet)}</td>
                      <td className="px-4 py-3 text-right text-zinc-600">{formatCurrency(dept.averageGross)}</td>
                      <td className="px-4 py-3 text-right text-zinc-600">{formatCurrency(dept.averageNet)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !summary && !error && (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-zinc-500">No payroll data available for the selected period</p>
          </div>
        )}
      </div>
    </Protected>
  );
}
