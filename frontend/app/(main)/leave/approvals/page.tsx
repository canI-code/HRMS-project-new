"use client";

import { Protected } from "@/components/auth/Protected";
import { LeaveApprovalsPanel } from "@/components/leave/LeaveApprovalsPanel";

export default function ApprovalsPage() {
  return (
    <Protected roles={["manager", "hr_admin", "super_admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Approvals</h1>
          <p className="text-muted-foreground">Review and action pending leave requests.</p>
        </div>
        <LeaveApprovalsPanel />
      </div>
    </Protected>
  );
}
