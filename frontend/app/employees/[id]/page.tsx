"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth/context";
import { employeeApi } from "../../../lib/employees/api";
import type { Employee } from "../../../lib/employees/types";
import { AppShell } from "../../../components/layout/AppShell";
import { ProtectedPage } from "../../../components/auth/ProtectedPage";

export default function EmployeeDetailPage() {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatEmploymentType = (type: string) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const formatStatus = (status: string) => {
    return status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  if (loading) {
    return (
      <ProtectedPage>
        <AppShell>
          <div className="flex items-center justify-center p-12">
      );
      );
            <p className="text-sm text-zinc-600">Loading employee details...</p>
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
            <Link
              href="/employees"
              className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              ← Back to employees
            </Link>
          </div>
        </AppShell>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <AppShell>
        <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/employees"
              className="mb-2 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              ← Back to employees
            </Link>
            <h1 className="text-2xl font-semibold text-zinc-900">
              {employee.personal.firstName} {employee.personal.lastName}
            </h1>
            <p className="mt-1 text-sm text-zinc-600">{employee.employeeCode}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/employees/${employee._id}/edit`}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
            >
              Edit
            </Link>
          </div>
        </div>

        {/* Personal Information */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Personal Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Full Name</label>
              <p className="mt-1 text-sm text-zinc-900">
                {employee.personal.firstName} {employee.personal.middleName ? `${employee.personal.middleName} ` : ""}{employee.personal.lastName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Date of Birth</label>
              <p className="mt-1 text-sm text-zinc-900">{formatDate(employee.personal.dateOfBirth)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Gender</label>
              <p className="mt-1 text-sm text-zinc-900">
                {employee.personal.gender ? employee.personal.gender.charAt(0).toUpperCase() + employee.personal.gender.slice(1) : "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Marital Status</label>
              <p className="mt-1 text-sm text-zinc-900">
                {employee.personal.maritalStatus ? employee.personal.maritalStatus.charAt(0).toUpperCase() + employee.personal.maritalStatus.slice(1) : "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Email</label>
              <p className="mt-1 text-sm text-zinc-900">{employee.personal.contact.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Phone</label>
              <p className="mt-1 text-sm text-zinc-900">{employee.personal.contact.phone || "-"}</p>
            </div>
          </div>

          {employee.personal.addresses?.current && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-zinc-700">Current Address</label>
              <p className="mt-1 text-sm text-zinc-900">
                {employee.personal.addresses.current.line1}
                {employee.personal.addresses.current.line2 && `, ${employee.personal.addresses.current.line2}`}
                <br />
                {employee.personal.addresses.current.city}, {employee.personal.addresses.current.state} {employee.personal.addresses.current.postalCode}
                <br />
                {employee.personal.addresses.current.country}
              </p>
            </div>
          )}

          {employee.personal.emergencyContacts && employee.personal.emergencyContacts.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-zinc-700">Emergency Contacts</label>
              <div className="mt-2 space-y-2">
                {employee.personal.emergencyContacts.map((contact, index) => (
                  <div key={index} className="rounded-lg border border-zinc-200 p-3">
                    <p className="text-sm font-medium text-zinc-900">{contact.name}</p>
                    <p className="text-xs text-zinc-600">
                      {contact.relationship} • {contact.phone}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Professional Information */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Professional Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Department</label>
              <p className="mt-1 text-sm text-zinc-900">{employee.professional.department || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Title</label>
              <p className="mt-1 text-sm text-zinc-900">{employee.professional.title || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Location</label>
              <p className="mt-1 text-sm text-zinc-900">{employee.professional.location || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Employment Type</label>
              <p className="mt-1 text-sm text-zinc-900">{formatEmploymentType(employee.professional.employmentType)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Start Date</label>
              <p className="mt-1 text-sm text-zinc-900">{formatDate(employee.professional.startDate)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">End Date</label>
              <p className="mt-1 text-sm text-zinc-900">{formatDate(employee.professional.endDate)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Status</label>
              <p className="mt-1 text-sm text-zinc-900">{formatStatus(employee.professional.status)}</p>
            </div>
          </div>
        </div>

        {/* Payroll Information */}
        {employee.payroll && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Payroll Information</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700">Base Salary</label>
                <p className="mt-1 text-sm text-zinc-900">
                  {employee.payroll.baseSalary
                    ? `${employee.payroll.salaryCurrency || "USD"} ${employee.payroll.baseSalary.toLocaleString()}`
                    : "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Variable Pay</label>
                <p className="mt-1 text-sm text-zinc-900">
                  {employee.payroll.variablePayPercent ? `${employee.payroll.variablePayPercent}%` : "-"}
                </p>
              </div>
              {employee.payroll.benefits && employee.payroll.benefits.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700">Benefits</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {employee.payroll.benefits.map((benefit, index) => (
                      <span
                        key={index}
                        className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Onboarding Status */}
        {employee.onboarding && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Onboarding Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700">Status</label>
                <p className="mt-1 text-sm text-zinc-900">{formatStatus(employee.onboarding.status)}</p>
              </div>
              {employee.onboarding.startedAt && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Started</label>
                  <p className="mt-1 text-sm text-zinc-900">{formatDate(employee.onboarding.startedAt)}</p>
                </div>
              )}
              {employee.onboarding.completedAt && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Completed</label>
                  <p className="mt-1 text-sm text-zinc-900">{formatDate(employee.onboarding.completedAt)}</p>
                </div>
              )}
              {employee.onboarding.steps && employee.onboarding.steps.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Steps</label>
                  <div className="mt-2 space-y-2">
                    {employee.onboarding.steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`h-5 w-5 flex-shrink-0 rounded-full ${step.completedAt ? "bg-emerald-500" : "bg-zinc-300"}`} />
                        <div>
                          <p className="text-sm text-zinc-900">{step.name}</p>
                          {step.completedAt && (
                            <p className="text-xs text-zinc-600">Completed {formatDate(step.completedAt)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
    </ProtectedPage>
  );
}
