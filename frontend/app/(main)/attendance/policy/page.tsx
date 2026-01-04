"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { Protected } from "@/components/auth/Protected";
import { attendanceApi } from "@/lib/attendance/api";
import type { AttendancePolicy, UpsertPolicyPayload } from "@/lib/attendance/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function PolicyPage() {
  const { state, refreshTokens } = useAuth();
  const tokens = state.tokens!;
  const [payload, setPayload] = useState<UpsertPolicyPayload>({
    name: "Default",
    standardWorkingMinutes: 480,
    halfDayThresholdMinutes: 240,
    lateArrivalGraceMinutes: 15,
    lateArrivalThresholdMinutes: 30,
    overtimeStartsAfterMinutes: 480,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policy, setPolicy] = useState<AttendancePolicy | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPolicy(null);
    try {
      const res = await attendanceApi.upsertPolicy(payload, tokens);
      setPolicy(res);
    } catch (err) {
      try {
        const next = await refreshTokens();
        if (next) {
          const res = await attendanceApi.upsertPolicy(payload, next);
          setPolicy(res);
        } else {
          throw err;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update policy");
      }
    } finally {
      setLoading(false);
    }
  };

  const setField = (key: keyof UpsertPolicyPayload, value: number | string) => {
    setPayload((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Protected roles={["hr_admin", "super_admin"]} fallback={<p>Access denied.</p>}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Policy</h1>
          <p className="text-muted-foreground mt-2">Configure attendance rules and thresholds</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Policy Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-6">
                  {/* Policy Name */}
                  <div>
                    <label className="block">
                      <span className="text-sm font-medium">Policy Name</span>
                      <input
                        type="text"
                        className="mt-2 w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={payload.name}
                        onChange={(e) => setField("name", e.target.value)}
                        placeholder="e.g., Standard Policy"
                      />
                    </label>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Working Hours</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <NumberField
                        label="Standard Working Minutes"
                        value={payload.standardWorkingMinutes}
                        onChange={(v) => setField("standardWorkingMinutes", v)}
                        hint="480 = 8 hours"
                      />
                      <NumberField
                        label="Half-Day Threshold (mins)"
                        value={payload.halfDayThresholdMinutes}
                        onChange={(v) => setField("halfDayThresholdMinutes", v)}
                        hint="Minimum hours for half day"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Late Arrival Policy</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <NumberField
                        label="Grace Period (mins)"
                        value={payload.lateArrivalGraceMinutes}
                        onChange={(v) => setField("lateArrivalGraceMinutes", v)}
                        hint="Allowed late arrival without penalty"
                      />
                      <NumberField
                        label="Late Threshold (mins)"
                        value={payload.lateArrivalThresholdMinutes}
                        onChange={(v) => setField("lateArrivalThresholdMinutes", v)}
                        hint="Mark as late after this time"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Overtime</h3>
                    <NumberField
                      label="Overtime Starts After (mins)"
                      value={payload.overtimeStartsAfterMinutes}
                      onChange={(v) => setField("overtimeStartsAfterMinutes", v)}
                      hint="Minimum working hours to be counted as overtime"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  {policy && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <p className="text-sm text-green-700">Policy updated successfully!</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Saving..." : "Save Policy"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Policy Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-medium mb-2">Standard Working Hours</p>
                  <p className="text-muted-foreground">Set the expected working hours per day (typically 480 mins = 8 hours)</p>
                </div>
                <div className="border-t pt-4">
                  <p className="font-medium mb-2">Half-Day Threshold</p>
                  <p className="text-muted-foreground">Minimum hours required to mark attendance as full day (e.g., 4 hours)</p>
                </div>
                <div className="border-t pt-4">
                  <p className="font-medium mb-2">Grace Period</p>
                  <p className="text-muted-foreground">Allow employees to arrive late without penalty (e.g., 15 mins)</p>
                </div>
                <div className="border-t pt-4">
                  <p className="font-medium mb-2">Late Threshold</p>
                  <p className="text-muted-foreground">Time after which late arrival is recorded (e.g., 30 mins after start time)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Protected>
  );
}

function NumberField({
  label,
  value,
  onChange,
  hint
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      <input
        type="number"
        className="mt-2 w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
        min="0"
      />
    </label>
  );
}
