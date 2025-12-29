"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { employeeApi } from "@/lib/employees/api";
import type { Employee, EmployeeListQuery, EmploymentType, EmployeeStatus } from "@/lib/employees/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Search, Plus, Filter, MoreHorizontal, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmployeesPage() {
  const router = useRouter();
  const { state } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filters
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage your organization's workforce.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/employees/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-9"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div>
              <Input
                placeholder="Department"
                value={department}
                onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
              />
            </div>
            <div>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as EmployeeStatus | ""); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <div>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={employmentTypeFilter}
                onChange={(e) => { setEmploymentTypeFilter(e.target.value as EmploymentType | ""); setPage(1); }}
              >
                <option value="">All Types</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading employees...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-64 items-center justify-center text-destructive">
              {error}
            </div>
          ) : employees.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2">
              <p className="text-muted-foreground">No employees found matching your filters.</p>
              <Button variant="link" onClick={() => { setSearch(""); setDepartment(""); setStatusFilter(""); setEmploymentTypeFilter(""); }}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm text-left">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Employee</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Department</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Joined</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {employees.map((employee) => (
                    <tr key={employee._id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{employee.personal.firstName[0]}{employee.personal.lastName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{employee.personal.firstName} {employee.personal.lastName}</span>
                            <span className="text-xs text-muted-foreground">{employee.personal.contact.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">{employee.professional.title}</td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className="font-normal">
                          {employee.professional.department}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant={
                          employee.professional.status === 'active' ? 'success' :
                            employee.professional.status === 'terminated' ? 'destructive' : 'warning'
                        }>
                          {employee.professional.status}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {new Date(employee.professional.startDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Link href={`/employees/${employee._id}`}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Info */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
