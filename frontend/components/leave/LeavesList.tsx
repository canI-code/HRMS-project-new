"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/context";
import { leaveApi } from "../../lib/leave/api";
import type { LeaveRecord } from "../../lib/leave/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, Clock, FileText, Loader2, XCircle, CheckCircle, AlertCircle } from "lucide-react";

const getLeaveTypeColor = (type: string) => {
  switch (type) {
    case "casual": return "bg-blue-100 text-blue-700 border-blue-200";
    case "sick": return "bg-red-100 text-red-700 border-red-200";
    case "earned": return "bg-green-100 text-green-700 border-green-200";
    case "unpaid": return "bg-gray-100 text-gray-700 border-gray-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
        <CheckCircle className="h-3 w-3" /> Approved
      </span>;
    case "rejected":
      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
        <XCircle className="h-3 w-3" /> Rejected
      </span>;
    case "pending":
      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
        <Clock className="h-3 w-3" /> Pending
      </span>;
    case "cancelled":
      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
        <XCircle className="h-3 w-3" /> Cancelled
      </span>;
    default:
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
  }
};

export function LeavesList() {
  const { state } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (state.tokens) {
      fetchLeaves();
    }
  }, [state.tokens]);

  const fetchLeaves = async () => {
    if (!state.tokens) return;
    try {
      setLoading(true);
      const data = await leaveApi.listLeaves({}, state.tokens);
      setLeaves(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch leaves");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (leaveId: string) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return;
    if (!state.tokens) return;

    try {
      const updated = await leaveApi.cancelLeave(
        leaveId,
        { reason: "Cancelled by employee" },
        state.tokens
      );

      setLeaves((prev) =>
        prev.map((leave) =>
          leave._id === leaveId ? updated : leave
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to cancel leave");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading leaves...</p>
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
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-center">No leave requests found</p>
          <p className="text-sm text-muted-foreground/70 text-center mt-2">Your leave history will appear here</p>
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
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium border capitalize ${getLeaveTypeColor(leave.leaveType)}`}>
                    {leave.leaveType} Leave
                  </span>
                  {getStatusBadge(leave.status)}
                </div>

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

                {leave.reason && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Reason</p>
                    <p className="text-sm">{leave.reason}</p>
                  </div>
                )}

                {leave.comments && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Comments</p>
                    <p className="text-sm text-muted-foreground">{leave.comments}</p>
                  </div>
                )}
              </div>

              {leave.status === "pending" && (
                <div className="ml-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancel(leave._id)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
