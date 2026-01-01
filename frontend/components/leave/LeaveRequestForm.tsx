"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth/context";
import { leaveApi } from "../../lib/leave/api";

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

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4 bg-white p-6 rounded-lg shadow">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">Leave request submitted successfully!</div>}

      <div className="form-control">
        <label className="label">
          <span className="label-text">Leave Type</span>
          <span className="label-text-alt text-blue-600 font-semibold">Available: {availableDays} days</span>
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
        disabled={loading || availableDays <= 0}
        className="btn btn-primary w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? "Submitting..." : availableDays <= 0 ? "Insufficient Balance" : "Request Leave"}
      </button>
    </form>
  );
}
