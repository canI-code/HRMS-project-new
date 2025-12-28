"use client";

import { LeaveRequestForm } from "../../../components/leave/LeaveRequestForm";

export default function RequestLeavePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Request Leave</h1>
      <LeaveRequestForm />
    </div>
  );
}
