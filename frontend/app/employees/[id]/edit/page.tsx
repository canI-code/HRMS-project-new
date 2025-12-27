"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../../../lib/auth/context";
import { employeeApi } from "../../../../lib/employees/api";
import type { Employee, UpdateEmployeePayload } from "../../../../lib/employees/types";
import { AppShell } from "../../../../components/layout/AppShell";
import { ProtectedPage } from "../../../../components/auth/ProtectedPage";
import { EmployeeForm } from "../../../../components/employees/EmployeeForm";

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const { state } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmployee = async () => {
      if (state.status !== "authenticated" || !state.tokens) return;
      if (!params.id || typeof params.id !== "string") return;

      setLoading(true);
      setError(null);

      try {
        const data = await employeeApi.get(params.id, state.tokens);
        setEmployee(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load employee");
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [params.id, state.status, state.tokens]);

  const handleSubmit = async (payload: UpdateEmployeePayload) => {
    if (state.status !== "authenticated" || !state.tokens) {
      throw new Error("Not authenticated");
    }
    if (!params.id || typeof params.id !== "string") {
      throw new Error("Invalid employee ID");
    }

    await employeeApi.update(params.id, payload, state.tokens);
    router.push(`/employees/${params.id}`);
  };

  const handleCancel = () => {
    if (params.id && typeof params.id === "string") {
      router.push(`/employees/${params.id}`);
    } else {
      router.push("/employees");
    }
  };

  if (loading) {
    return (
      <ProtectedPage>
        <AppShell>
          <div className="flex items-center justify-center p-12">
            <p className="text-sm text-zinc-600">Loading employee...</p>
          </div>
        </AppShell>
      </ProtectedPage>
    );
  }

  if (error || !employee) {
    return (
      <ProtectedPage>
        <AppShell>
          <div className="p-6">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
              <p className="text-sm text-red-600">{error || "Employee not found"}</p>
            </div>
          </div>
        </AppShell>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <AppShell>
        <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Edit Employee</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {employee.personal.firstName} {employee.personal.lastName} • {employee.employeeCode}
          </p>
        </div>

        <EmployeeForm mode="edit" employee={employee} organizationId={employee.organizationId} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </AppShell>
    </ProtectedPage>
  );
}
