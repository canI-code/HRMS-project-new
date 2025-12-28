"use client";

import { Protected } from "../../../components/auth/Protected";
import { LeavePolicyForm } from "../../../components/leave/LeavePolicyForm";

export default function LeavePolicyPage() {
  return (
    <Protected roles={["hr_admin", "super_admin"]}>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Leave Policy Configuration</h1>
        <LeavePolicyForm />
      </div>
    </Protected>
  );
}
