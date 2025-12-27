"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/context";
import { employeeApi } from "../../lib/employees/api";
import type { Employee, EmployeeListQuery, EmploymentType, EmployeeStatus } from "../../lib/employees/types";
import { AppShell } from "../../components/layout/AppShell";
import { ProtectedPage } from "../../components/auth/ProtectedPage";

export default function EmployeesPage() {
  const router = useRouter();
  const { state } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination and filters
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter states
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | "">("");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<EmploymentType | "">("");

  const loadEmployees = async () => {
    if (state.status !== "authenticated" || !state.tokens) return;
    
    setLoading(true);
    setError(null);

    try {
      const query: EmployeeListQuery = {
        page,
        limit,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      if (search) query.search = search;
      if (department) query.department = department;
      if (statusFilter) query.status = statusFilter;
      if (employmentTypeFilter) query.employmentType = employmentTypeFilter;

      const response = await employeeApi.list(query, state.tokens);
      setEmployees(response.employees || []);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [page, search, department, statusFilter, employmentTypeFilter, state.status]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on new search
  };

  const getStatusBadgeColor = (status: EmployeeStatus) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700";
      case "on_leave":
        return "bg-amber-100 text-amber-700";
      case "terminated":
        return "bg-red-100 text-red-700";
      default:
        return "bg-zinc-100 text-zinc-700";
    }
  };

  const formatEmploymentType = (type: EmploymentType) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const formatStatus = (status: EmployeeStatus) => {
    return status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <ProtectedPage>
      <AppShell>
        <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Employees</h1>
          </div>
          <Link
            href="/employees/new"
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Add Employee
          </Link>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Name, code, email..."
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                placeholder="Enter department..."
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as EmployeeStatus | ""); setPage(1); }}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Employment Type</label>
              <select
                value={employmentTypeFilter}
                onChange={(e) => { setEmploymentTypeFilter(e.target.value as EmploymentType | ""); setPage(1); }}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              >
                <option value="">All</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>
          </div>
        </div>

        {/* Employee List */}
        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white p-12 shadow-sm">
            <p className="text-sm text-zinc-600">Loading employees...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : !employees || employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-12 shadow-sm">
            <p className="text-sm text-zinc-600">No employees found</p>
            <Link
              href="/employees/new"
              className="mt-4 text-sm font-medium text-blue-600 hover:underline"
            >
              Add your first employee
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <table className="w-full">
                <thead className="border-b border-zinc-200 bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {employees.map((employee) => (
                    <tr key={employee._id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 text-sm text-zinc-900">{employee.employeeCode}</td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-zinc-900">
                            {employee.personal.firstName} {employee.personal.lastName}
                          </div>
                          <div className="text-xs text-zinc-600">{employee.personal.contact.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-900">
                        {employee.professional.department || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-900">
                        {employee.professional.title || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-900">
                        {formatEmploymentType(employee.professional.employmentType)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeColor(employee.professional.status)}`}>
                          {formatStatus(employee.professional.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/employees/${employee._id}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                <div className="text-sm text-zinc-600">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} employees
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-zinc-200 px-3 py-1 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="flex items-center px-3 text-sm text-zinc-700">
                    Page {page} of {totalPages}
                  </div>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-zinc-200 px-3 py-1 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
    </ProtectedPage>
  );
}
