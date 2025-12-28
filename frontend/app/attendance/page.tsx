"use client";

import Link from "next/link";
import { Protected } from "../../components/auth/Protected";

export default function AttendanceHome() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Attendance</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link className="btn btn-primary" href="/attendance/check-in">Check In</Link>
        <Link className="btn btn-secondary" href="/attendance/check-out">Check Out</Link>
        <Link className="btn btn-accent" href="/attendance/monthly">Monthly Summary</Link>
        <Protected roles={["hr_admin", "super_admin"]}>
          <Link className="btn btn-warning" href="/attendance/policy">Policy Settings</Link>
        </Protected>
      </div>
    </div>
  );
}
