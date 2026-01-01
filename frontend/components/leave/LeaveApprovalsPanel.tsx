"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/context";
import { leaveApi } from "../../lib/leave/api";
import type { LeaveRecord } from "../../lib/leave/types";

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

  if (loading) return <div className="loading loading-spinner"></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Reason</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-4">
                No pending leave approvals
              </td>
            </tr>
          ) : (
            leaves.map((leave) => (
              <tr key={leave._id}>
                <td>
                  <div>
                    <div className="font-semibold">
                      {leave.employeeId.firstName} {leave.employeeId.lastName}
                    </div>
                    <div className="text-sm opacity-75">{leave.employeeId.email}</div>
                  </div>
                </td>
                <td className="capitalize">{leave.leaveType}</td>
                <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                <td>{leave.reason || "-"}</td>
                <td className="space-x-2">
                  <button
                    onClick={() => handleApprove(leave._id)}
                    disabled={processing === leave._id}
                    className="btn btn-sm btn-success"
                  >
                    {processing === leave._id ? "..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleReject(leave._id)}
                    disabled={processing === leave._id}
                    className="btn btn-sm btn-error"
                  >
                    {processing === leave._id ? "..." : "Reject"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
