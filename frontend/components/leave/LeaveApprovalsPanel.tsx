"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/context";
import { leaveApi } from "../../lib/leave/api";
import type { LeaveRecord } from "../../lib/leave/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, Clock, User, FileText, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const getLeaveTypeColor = (type: string) => {
  switch (type) {
    case "casual": return "bg-blue-100 text-blue-700 border-blue-200";
    case "sick": return "bg-red-100 text-red-700 border-red-200";
    case "earned": return "bg-green-100 text-green-700 border-green-200";
    case "unpaid": return "bg-gray-100 text-gray-700 border-gray-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export function LeaveApprovalsPanel() {
  const { state } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (state.tokens) {
      fetchPendingLeaves();
    }
  }, [state.tokens]);

  const fetchPendingLeaves = async () => {
    if (!state.tokens) return;
    try {
      setLoading(true);
      const data = await leaveApi.listLeaves({ status: "pending", showAll: true }, state.tokens);
      setLeaves(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch pending leaves");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId: string) => {
    if (!state.tokens) return;
    try {
      setProcessing(leaveId);
      await leaveApi.approveLeave(leaveId, { comments: "Approved" }, state.tokens);
      setLeaves((prev) => prev.filter((leave) => leave._id !== leaveId));
    } catch (err: any) {
      alert(err.message || "Failed to approve leave");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (leaveId: string) => {
    const comments = prompt("Enter rejection reason:");
    if (!comments) return;
    if (!state.tokens) return;

    try {
      setProcessing(leaveId);
      await leaveApi.rejectLeave(leaveId, { comments }, state.tokens);
      setLeaves((prev) => prev.filter((leave) => leave._id !== leaveId));
    } catch (err: any) {
      alert(err.message || "Failed to reject leave");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading pending leave approvals...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leaves.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500/50 mb-3" />
          <p className="text-muted-foreground text-center font-medium">No pending leave approvals</p>
          <p className="text-sm text-muted-foreground/70 text-center mt-2">All leave requests have been processed</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {leaves.map((leave) => (
        <Card key={leave._id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-4">
                {/* Employee Info */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-base">
                      {leave.employeeId.firstName} {leave.employeeId.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{leave.employeeId.email}</p>
                  </div>
                </div>

                {/* Leave Type Badge */}
                <div>
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border capitalize ${getLeaveTypeColor(leave.leaveType)}`}>
                    {leave.leaveType} Leave
                  </span>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p className="font-medium">{new Date(leave.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">End Date</p>
                      <p className="font-medium">{new Date(leave.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                {leave.reason && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Reason
                    </p>
                    <p className="text-sm">{leave.reason}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="ml-6 flex flex-col gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApprove(leave._id)}
                  disabled={processing === leave._id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processing === leave._id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(leave._id)}
                  disabled={processing === leave._id}
                >
                  {processing === leave._id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
