"use client";

import { useState, useEffect } from "react";
import { Protected } from "../../../components/auth/Protected";
import { SalaryAssignmentPanel } from "../../../components/payroll/SalaryAssignmentPanel";

export default function SalaryAssignmentPage() {
  return (
    <Protected roles={["hr_admin", "super_admin"]}>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Assign Salary to Employees</h1>
        <SalaryAssignmentPanel />
      </div>
    </Protected>
  );
}
