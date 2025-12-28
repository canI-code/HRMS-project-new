"use client";

import { Protected } from "../../../components/auth/Protected";

export default function PayrollReportsPage() {
  return (
    <Protected roles={["hr_admin", "super_admin"]}>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Payroll Reports</h1>
        <div className="alert alert-info">
          Reports functionality will be implemented in Phase 8 enhancement
        </div>
      </div>
    </Protected>
  );
}
