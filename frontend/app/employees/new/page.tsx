"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth/context";
import { employeeApi } from "../../../lib/employees/api";
import type { CreateEmployeePayload, UpdateEmployeePayload } from "../../../lib/employees/types";
import { AppShell } from "../../../components/layout/AppShell";
import { ProtectedPage } from "../../../components/auth/ProtectedPage";
import { EmployeeForm } from "../../../components/employees/EmployeeForm";

export default function NewEmployeePage() {
  const router = useRouter();
  const { state } = useAuth();

  const organizationId = state.user?.organizationId || "";

  const handleSubmit = async (payload: CreateEmployeePayload | UpdateEmployeePayload) => {
    if (state.status !== "authenticated" || !state.tokens) {
      throw new Error("Not authenticated");
    }
    const employee = await employeeApi.create(payload as CreateEmployeePayload, state.tokens);
    router.push(`/employees/${employee._id}`);
  };

  const handleCancel = () => {
    router.push("/employees");
  };

  return (
    <ProtectedPage>
      <AppShell>
        <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Add Employee</h1>
        </div>

        <EmployeeForm mode="create" organizationId={organizationId} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </AppShell>
    </ProtectedPage>
  );
}
