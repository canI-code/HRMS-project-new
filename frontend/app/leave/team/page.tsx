"use client";

import { Protected } from "../../../components/auth/Protected";
import { TeamLeavesList } from "../../../components/leave/TeamLeavesList";

export default function TeamLeavesPage() {
  return (
    <Protected roles={["manager", "hr_admin", "super_admin"]}>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Team Leave Requests</h1>
        <TeamLeavesList />
      </div>
    </Protected>
  );
}
