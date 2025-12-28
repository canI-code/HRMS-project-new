"use client";

import Link from "next/link";
import { Protected } from "../../components/auth/Protected";

export default function PayrollHome() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Payroll Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Protected roles={["hr_admin", "super_admin"]}>
          <Link className="btn btn-primary" href="/payroll/structure">
            📋 Salary Structure
          </Link>
        </Protected>
        <Protected roles={["hr_admin", "super_admin"]}>
          <Link className="btn btn-secondary" href="/payroll/assign">
            💰 Assign Salary
          </Link>
        </Protected>
        <Protected roles={["hr_admin", "super_admin"]}>
          <Link className="btn btn-accent" href="/payroll/run">
            ▶️ Run Payroll
          </Link>
        </Protected>
        <Link className="btn btn-info" href="/payroll/payslips">
          📄 My Payslips
        </Link>
        <Protected roles={["hr_admin", "super_admin"]}>
          <Link className="btn btn-warning" href="/payroll/reports">
            📊 Payroll Reports
          </Link>
        </Protected>
      </div>
    </div>
  );
}
