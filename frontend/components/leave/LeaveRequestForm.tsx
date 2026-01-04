"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth/context";
import { leaveApi } from "../../lib/leave/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, FileText, Clock, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

const getLeaveTypeInfo = (type: string) => {
  switch (type) {
    case "casual":
      return { color: "bg-blue-50 border-blue-200 text-blue-700", name: "Casual Leave" };
    case "sick":
      return { color: "bg-red-50 border-red-200 text-red-700", name: "Sick Leave" };
    case "earned":
      return { color: "bg-green-50 border-green-200 text-green-700", name: "Earned Leave" };
    case "unpaid":
      return { color: "bg-gray-50 border-gray-200 text-gray-700", name: "Unpaid Leave" };
    default:
      return { color: "bg-gray-50 border-gray-200 text-gray-700", name: type };
  }
};

export function LeaveRequestForm() {
  const { state } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [balances, setBalances] = useState<{ leaveType: string; available: number }[]>([]);

  useEffect(() => {
    if (state.tokens) {
      loadBalances();
    }
  }, [state.tokens]);

  const loadBalances = async () => {
    try {
      if (!state.tokens) return;
      const data = await leaveApi.getBalances(state.tokens);
      setBalances(data);
    } catch (e) {
      console.error("Failed to load balances", e);
    }
  };

  const [formData, setFormData] = useState({
    leaveType: "casual",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectedBalance = balances.find(b => b.leaveType === formData.leaveType);
  const availableDays = selectedBalance ? selectedBalance.available : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.tokens) {
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await leaveApi.requestLeave(
        {
          leaveType: formData.leaveType as any,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          reason: formData.reason,
        },
        state.tokens
      );

      setSuccess(true);
      setFormData({
        leaveType: "casual",
        startDate: "",
        endDate: "",
        reason: "",
      });
      loadBalances(); // Refresh balance
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to request leave");
    } finally {
      setLoading(false);
    }
  };

  const leaveTypeInfo = getLeaveTypeInfo(formData.leaveType);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Request Leave
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Submit a new leave request.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">Leave request submitted successfully!</p>
            </div>
          )}

          {/* Leave Type Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Leave Type
              </label>
              <span className="text-sm font-semibold text-primary">
                Available: {availableDays} days
              </span>
            </div>
            <select
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-medium capitalize transition-colors ${leaveTypeInfo.color}`}
              required
            >
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
              <option value="earned">Earned</option>
              <option value="unpaid">Unpaid</option>
            </select>
            
            {availableDays <= 0 && formData.leaveType !== "unpaid" && (
              <div className="flex items-start gap-2 text-amber-600 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Insufficient balance for {leaveTypeInfo.name}. Consider unpaid leave.</span>
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reason
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Enter reason for leave"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">Optional: Provide details about your leave request</p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || (availableDays <= 0 && formData.leaveType !== "unpaid")}
            className="w-full py-3"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : availableDays <= 0 && formData.leaveType !== "unpaid" ? (
              <>
                <XCircle className="h-5 w-5 mr-2" />
                Insufficient Balance
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Request Leave
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
