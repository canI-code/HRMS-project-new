"use client";

import { Protected } from "../../../components/auth/Protected";
import { LeaveApprovalsPanel } from "../../../components/leave/LeaveApprovalsPanel";

export default function ApprovalsPage() {
  return (
    <Protected roles={["manager", "hr_admin", "super_admin"]}>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Pending Leave Approvals</h1>
        <LeaveApprovalsPanel />
      </div>
    </Protected>
  );
}
