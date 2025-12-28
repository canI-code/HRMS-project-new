"use client";

import { useState } from "react";
import { Protected } from "../../../components/auth/Protected";
import { PayrollRunPanel } from "../../../components/payroll/PayrollRunPanel";

export default function PayrollRunPage() {
  return (
    <Protected roles={["hr_admin", "super_admin"]}>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Run Payroll</h1>
        <PayrollRunPanel />
      </div>
    </Protected>
  );
}
