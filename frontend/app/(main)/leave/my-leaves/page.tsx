"use client";

import { LeavesList } from "@/components/leave/LeavesList";

export default function MyLeavesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Leaves</h1>
        <p className="text-muted-foreground">View your leave history and balance.</p>
      </div>
      <LeavesList />
    </div>
  );
}
