"use client";

import { useState } from "react";
import { useAuth } from "../../lib/auth/context";
import { leaveApi } from "../../lib/leave/api";

export function LeaveRequestForm() {
  const { state } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to request leave");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4 bg-white p-6 rounded-lg shadow">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">Leave request submitted successfully!</div>}

      <div className="form-control">
        <label className="label">
          <span className="label-text">Leave Type</span>
        </label>
        <select
          name="leaveType"
          value={formData.leaveType}
          onChange={handleChange}
          className="select select-bordered"
          required
        >
          <option value="casual">Casual</option>
          <option value="sick">Sick</option>
          <option value="earned">Earned</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Start Date</span>
        </label>
        <input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          className="input input-bordered"
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">End Date</span>
        </label>
        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          className="input input-bordered"
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Reason</span>
        </label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          className="textarea textarea-bordered"
          placeholder="Enter reason for leave"
          rows={4}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full"
      >
        {loading ? "Submitting..." : "Request Leave"}
      </button>
    </form>
  );
}
