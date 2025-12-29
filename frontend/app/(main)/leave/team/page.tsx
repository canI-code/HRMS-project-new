"use client";

import { Protected } from "@/components/auth/Protected";
import { TeamLeavesList } from "@/components/leave/TeamLeavesList";

export default function TeamLeavesPage() {
  return (
    <Protected roles={["manager", "hr_admin", "super_admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Leave Requests</h1>
          <p className="text-muted-foreground">View and manage leave requests from your team.</p>
        </div>
        <TeamLeavesList />
      </div>
    </Protected>
  );
}
