"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/context";
import { leaveApi } from "../../lib/leave/api";
import type { LeaveRecord } from "../../lib/leave/types";

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

  if (loading) return <div className="loading loading-spinner"></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
            <th>Reason</th>
            <th>Comments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-4">
                No leave requests found
              </td>
            </tr>
          ) : (
            leaves.map((leave) => (
              <tr key={leave._id}>
                <td className="capitalize">{leave.leaveType}</td>
                <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                <td>
                  <span
                    className={`badge ${
                      leave.status === "approved"
                        ? "badge-success"
                        : leave.status === "rejected"
                        ? "badge-error"
                        : leave.status === "pending"
                        ? "badge-warning"
                        : "badge-ghost"
                    }`}
                  >
                    {leave.status}
                  </span>
                </td>
                <td>{leave.reason || "-"}</td>
                <td>{leave.comments || "-"}</td>
                <td>
                  {leave.status === "pending" && (
                    <button
                      onClick={() => handleCancel(leave._id)}
                      className="btn btn-sm btn-error"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
