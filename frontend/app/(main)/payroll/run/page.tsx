"use client";

import { Protected } from "@/components/auth/Protected";
import { PayrollRunPanel } from "@/components/payroll/PayrollRunPanel";

export default function PayrollRunPage() {
  return (
    <Protected roles={["hr_admin", "super_admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Run Payroll</h1>
          <p className="text-muted-foreground">Process payroll for the month.</p>
        </div>
        <PayrollRunPanel />
      </div>
    </Protected>
  );
}
