"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/context";
import { leaveApi } from "../../lib/leave/api";
import type { LeaveRecord } from "../../lib/leave/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, User, FileText, Loader2, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

export function TeamLeavesList() {
  const { state } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (state.tokens) {
      fetchLeaves();
    }
  }, [state.tokens, statusFilter]);

  const fetchLeaves = async () => {
    if (!state.tokens) return;
    try {
      setLoading(true);
      const query: any = { showAll: 'true' };
      if (statusFilter !== 'all') {
        query.status = statusFilter;
      }
      // Add showAll parameter to fetch all team leaves
      const response = await fetch(
        `http://localhost:3000/api/v1/leaves?${new URLSearchParams(query).toString()}`,
        {
          headers: {
            Authorization: `Bearer ${state.tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setLeaves(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch team leaves');
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch team leaves");
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading team leaves...</p>
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

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setStatusFilter("all")}
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
            >
              All
            </Button>
            <Button
              onClick={() => setStatusFilter("pending")}
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              className={statusFilter === "pending" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
            >
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Button>
            <Button
              onClick={() => setStatusFilter("approved")}
              variant={statusFilter === "approved" ? "default" : "outline"}
              size="sm"
              className={statusFilter === "approved" ? "bg-green-500 hover:bg-green-600" : ""}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Approved
            </Button>
            <Button
              onClick={() => setStatusFilter("rejected")}
              variant={statusFilter === "rejected" ? "default" : "outline"}
              size="sm"
              className={statusFilter === "rejected" ? "bg-red-500 hover:bg-red-600" : ""}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Rejected
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests List */}
      {leaves.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-center">No leave requests found</p>
            <p className="text-sm text-muted-foreground/70 text-center mt-2">
              {statusFilter !== 'all' ? `No ${statusFilter} leave requests` : 'Team leave requests will appear here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => (
            <Card key={leave._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Employee Info and Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-base">
                          {leave.employeeId.firstName} {leave.employeeId.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {leave.employeeId.professional?.title || 'Employee'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(leave.status)}
                  </div>

                  {/* Leave Type and Dates */}
                  <div className="flex flex-wrap items-center gap-4">
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border capitalize ${getLeaveTypeColor(leave.leaveType)}`}>
                      {leave.leaveType} Leave
                    </span>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-muted-foreground">to</span>
                      <span className="font-medium">
                        {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
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

                  {/* Comments */}
                  {leave.comments && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Manager Comments</p>
                      <p className="text-sm text-muted-foreground">{leave.comments}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
