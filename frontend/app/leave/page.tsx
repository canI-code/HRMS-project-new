"use client";

import Link from "next/link";
import { Protected } from "../../components/auth/Protected";

export default function LeaveHome() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Leave Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link className="btn btn-primary" href="/leave/request">Request Leave</Link>
        <Link className="btn btn-secondary" href="/leave/my-leaves">My Leaves</Link>
        <Link className="btn btn-info" href="/leave/calendar">Leave Calendar</Link>
        <Protected roles={["manager", "hr_admin", "super_admin"]}>
          <Link className="btn btn-accent" href="/leave/team">Team Leaves</Link>
        </Protected>
        <Protected roles={["manager", "hr_admin", "super_admin"]}>
          <Link className="btn btn-warning" href="/leave/approvals">Pending Approvals</Link>
        </Protected>
        <Protected roles={["hr_admin", "super_admin"]}>
          <Link className="btn btn-ghost" href="/leave/policy">Leave Policy</Link>
        </Protected>
      </div>
    </div>
  );
}
