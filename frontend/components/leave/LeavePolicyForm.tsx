"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth/context";
import { leaveApi } from "../../lib/leave/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface LeaveBalance {
  leaveType: string;
  totalDays: number;
}

const leaveTypeInfo: Record<string, { color: string; description: string }> = {
  casual: {
    color: "bg-blue-100 border-blue-300",
    description: "For personal reasons and personal matters"
  },
  sick: {
    color: "bg-red-100 border-red-300",
    description: "For medical/health reasons (may require certificate)"
  },
  earned: {
    color: "bg-green-100 border-green-300",
    description: "Can be accumulated and carried forward to next year"
  },
  unpaid: {
    color: "bg-gray-100 border-gray-300",
    description: "No limit, deducted from salary"
  }
};

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Leave Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <p className="text-sm text-muted-foreground mb-6">
                  Configure the annual leave balance for each leave type. These apply to all employees.
                </p>

                <div className="space-y-4">
                  {leaveBalances.map((balance, index) => {
                    const info = leaveTypeInfo[balance.leaveType] || {};
                    return (
                      <div
                        key={balance.leaveType}
                        className={`p-4 border-2 rounded-lg transition-all ${info.color}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <label className="block">
                              <span className="font-semibold capitalize text-gray-800">{balance.leaveType} Leave</span>
                              <p className="text-xs text-gray-600 mt-1">{info.description}</p>
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={balance.totalDays}
                              onChange={(e) =>
                                handleChange(index, "totalDays", parseInt(e.target.value) || 0)
                              }
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                              min="0"
                              max="365"
                            />
                            <span className="text-sm font-medium text-gray-700 w-16">days/year</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700">Leave policy updated successfully!</p>
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
              <CardTitle className="text-base">Leave Types Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-blue-700 mb-1">Casual Leave</h4>
                <p className="text-muted-foreground text-xs">For personal reasons, personal matters, and general leave</p>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-red-700 mb-1">Sick Leave</h4>
                <p className="text-muted-foreground text-xs">For medical and health reasons. Medical certificate may be required for 3+ consecutive days</p>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-green-700 mb-1">Earned Leave</h4>
                <p className="text-muted-foreground text-xs">Can be accumulated and carried forward to the next fiscal year</p>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-700 mb-1">Unpaid Leave</h4>
                <p className="text-muted-foreground text-xs">No limit on duration. Salary will be deducted for these days</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <p className="font-medium text-gray-700 mb-1">💡 Best Practices:</p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Casual: 12-15 days</li>
                  <li>Sick: 10-12 days</li>
                  <li>Earned: 15-20 days</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
