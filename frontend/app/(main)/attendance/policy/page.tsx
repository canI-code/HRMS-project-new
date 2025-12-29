"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { Protected } from "@/components/auth/Protected";
import { attendanceApi } from "@/lib/attendance/api";
import type { AttendancePolicy, UpsertPolicyPayload } from "@/lib/attendance/types";

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
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-semibold">Attendance Policy</h1>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm">Name</span>
            <input className="mt-1 w-full border rounded p-2" value={payload.name} onChange={(e) => setField("name", e.target.value)} />
          </label>
          <NumberField label="Standard Minutes" value={payload.standardWorkingMinutes} onChange={(v) => setField("standardWorkingMinutes", v)} />
          <NumberField label="Half-Day Threshold" value={payload.halfDayThresholdMinutes} onChange={(v) => setField("halfDayThresholdMinutes", v)} />
          <NumberField label="Late Grace Minutes" value={payload.lateArrivalGraceMinutes} onChange={(v) => setField("lateArrivalGraceMinutes", v)} />
          <NumberField label="Late Threshold Minutes" value={payload.lateArrivalThresholdMinutes} onChange={(v) => setField("lateArrivalThresholdMinutes", v)} />
          <NumberField label="Overtime Starts After" value={payload.overtimeStartsAfterMinutes} onChange={(v) => setField("overtimeStartsAfterMinutes", v)} />
          <button type="submit" className="btn btn-warning" disabled={loading}>{loading ? "Saving..." : "Save Policy"}</button>
        </form>

        {error && <p className="text-red-600">{error}</p>}
        {policy && (
          <div className="border rounded p-3">
            <p>Policy updated: {policy.name}</p>
          </div>
        )}
      </div>
    </Protected>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-sm">{label}</span>
      <input
        type="number"
        className="mt-1 w-full border rounded p-2"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
      />
    </label>
  );
}
