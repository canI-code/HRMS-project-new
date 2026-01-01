"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth/context";
import { leaveApi } from "../../lib/leave/api";

interface LeaveBalance {
  leaveType: string;
  totalDays: number;
}

export function LeavePolicyForm() {
  const { state } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([
    { leaveType: "casual", totalDays: 12 },
    { leaveType: "sick", totalDays: 10 },
    { leaveType: "earned", totalDays: 15 },
    { leaveType: "unpaid", totalDays: 0 },
  ]);

  useEffect(() => {
    if (state.tokens) {
      loadPolicy();
    }
  }, [state.tokens]);

  const loadPolicy = async () => {
    try {
      if (!state.tokens) return;
      const policy = await leaveApi.getPolicy(state.tokens);
      if (policy.allocations && policy.allocations.length > 0) {
        setLeaveBalances(policy.allocations);
      }
    } catch (err: any) {
      console.error("Failed to load policy:", err);
      // Fallback to defaults if not found is okay, or show error
    }
  };

  const handleChange = (index: number, field: keyof LeaveBalance, value: any) => {
    const updated = [...leaveBalances];
    updated[index] = { ...updated[index], [field]: value };
    setLeaveBalances(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.tokens) return;
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await leaveApi.updatePolicy({ allocations: leaveBalances }, state.tokens);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update leave policy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {error && <div className="alert alert-error mb-4">{error}</div>}
      {success && <div className="alert alert-success mb-4">Leave policy updated successfully!</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Annual Leave Balances</h2>
          <p className="text-sm text-gray-600 mb-4">
            Configure the default annual leave balance for each leave type. These apply to all employees.
          </p>
        </div>

        {leaveBalances.map((balance, index) => (
          <div key={balance.leaveType} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label className="label">
                <span className="label-text font-medium capitalize">{balance.leaveType} Leave</span>
              </label>
            </div>
            <div className="w-32">
              <input
                type="number"
                value={balance.totalDays}
                onChange={(e) => handleChange(index, "totalDays", parseInt(e.target.value) || 0)}
                className="input input-bordered w-full"
                min="0"
                max="365"
              />
            </div>
            <div className="text-sm text-gray-600">days/year</div>
          </div>
        ))}

        <div className="border-t pt-4">
          <h3 className="text-md font-semibold mb-2">Policy Rules</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Casual leave: Can be taken for personal reasons</li>
            <li>• Sick leave: Requires medical certificate for 3+ consecutive days</li>
            <li>• Earned leave: Can be accumulated and carried forward</li>
            <li>• Unpaid leave: No limit, deducted from salary</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? "Saving..." : "Save Policy"}
        </button>
      </form>
    </div>
  );
}
