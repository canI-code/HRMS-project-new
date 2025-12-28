"use client";

import { LeavesList } from "../../../components/leave/LeavesList";

export default function MyLeavesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">My Leave Requests</h1>
      <LeavesList />
    </div>
  );
}
