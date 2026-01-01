"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/context";
import { leaveApi } from "../../lib/leave/api";
import type { LeaveRecord } from "../../lib/leave/types";

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

  if (loading) return <div className="loading loading-spinner"></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${statusFilter === "all"
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
            }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter("pending")}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${statusFilter === "pending"
            ? "bg-amber-500 text-white border-amber-500"
            : "bg-white text-zinc-700 border-zinc-200 hover:bg-amber-50"
            }`}
        >
          Pending
        </button>
        <button
          onClick={() => setStatusFilter("approved")}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${statusFilter === "approved"
            ? "bg-emerald-500 text-white border-emerald-500"
            : "bg-white text-zinc-700 border-zinc-200 hover:bg-emerald-50"
            }`}
        >
          Approved
        </button>
        <button
          onClick={() => setStatusFilter("rejected")}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${statusFilter === "rejected"
            ? "bg-red-500 text-white border-red-500"
            : "bg-white text-zinc-700 border-zinc-200 hover:bg-red-50"
            }`}
        >
          Rejected
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Comments</th>
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
                  <td>
                    <div>
                      <div className="font-semibold">
                        {leave.employeeId.firstName} {leave.employeeId.lastName}
                      </div>
                      <div className="text-sm text-gray-600">{leave.employeeId.professional?.title || '-'}</div>
                    </div>
                  </td>
                  <td className="capitalize">{leave.leaveType}</td>
                  <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                  <td>
                    <span
                      className={`badge ${leave.status === "approved"
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
