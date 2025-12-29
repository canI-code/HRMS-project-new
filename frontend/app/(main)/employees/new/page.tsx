"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { employeeApi } from "@/lib/employees/api";
import type { CreateEmployeePayload, UpdateEmployeePayload } from "@/lib/employees/types";
import { EmployeeForm } from "@/components/employees/EmployeeForm";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add New Employee</h1>
        <p className="text-muted-foreground">Create a new employee profile in the system.</p>
      </div>
      <EmployeeForm mode="create" organizationId={organizationId} onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
