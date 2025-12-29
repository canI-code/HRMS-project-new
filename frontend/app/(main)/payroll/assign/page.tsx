"use client";

import { Protected } from "@/components/auth/Protected";
import { SalaryAssignmentPanel } from "@/components/payroll/SalaryAssignmentPanel";

export default function SalaryAssignmentPage() {
  return (
    <Protected roles={["hr_admin", "super_admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assign Salary</h1>
          <p className="text-muted-foreground">Configure salary details for employees.</p>
        </div>
        <SalaryAssignmentPanel />
      </div>
    </Protected>
  );
}
