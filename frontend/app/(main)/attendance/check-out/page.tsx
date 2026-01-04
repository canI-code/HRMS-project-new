"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { employeeApi } from "@/lib/employees/api";
import type { Employee } from "@/lib/employees/types";
import { attendanceApi } from "@/lib/attendance/api";
import type { AttendanceRecord } from "@/lib/attendance/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Clock, User, CheckCircle, Loader2, AlertCircle, LogOut, TrendingUp } from "lucide-react";

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

  const formatMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Check Out</h1>
        <p className="text-muted-foreground">Record employee attendance check-out time</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Attendance Check Out
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Employee
              </label>
              <select
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
              {!isPrivileged && (
                <p className="text-xs text-muted-foreground">You can only check out for yourself</p>
              )}
            </div>

            <Button type="submit" disabled={!canSubmit} className="w-full" size="lg" variant="secondary">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Checking out...
                </>
              ) : (
                <>
                  <LogOut className="h-5 w-5 mr-2" />
                  Check Out
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-6 flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Check-out Failed</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6 p-6 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold text-green-900">Successfully Checked Out</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-green-800">
                    Check-out time: {result.checkOut ? new Date(result.checkOut).toLocaleString('en-US', { 
                      dateStyle: 'medium', 
                      timeStyle: 'short' 
                    }) : "-"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-green-200">
                  <div className="space-y-1">
                    <p className="text-xs text-green-600 font-medium">Working Time</p>
                    <p className="text-lg font-semibold text-green-900">
                      {formatMinutesToHours(result.workingMinutes ?? 0)}
                    </p>
                  </div>
                  {(result.overtimeMinutes ?? 0) > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Overtime
                      </p>
                      <p className="text-lg font-semibold text-green-900">
                        {formatMinutesToHours(result.overtimeMinutes ?? 0)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {result.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
