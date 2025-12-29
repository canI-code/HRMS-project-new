"use client";

import { Protected } from "@/components/auth/Protected";
import { LeavePolicyForm } from "@/components/leave/LeavePolicyForm";

export default function LeavePolicyPage() {
  return (
    <Protected roles={["hr_admin", "super_admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Policy</h1>
          <p className="text-muted-foreground">Configure leave allocation rules and types.</p>
        </div>
        <LeavePolicyForm />
      </div>
    </Protected>
  );
}
