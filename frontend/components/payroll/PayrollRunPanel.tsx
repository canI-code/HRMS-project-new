"use client";

import { useState, useEffect } from "react";
import { payrollApi } from "../../lib/payroll/api";
import { useAuth } from "../../lib/auth/context";
import { EmployeeWithSalary } from "../../lib/payroll/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, Users, DollarSign, AlertCircle, CheckCircle, Loader2, RefreshCw } from "lucide-react";

export function PayrollRunPanel() {
  const { state } = useAuth();
  const tokens = state.tokens;
  const isAuthenticated = state.status === "authenticated";
  const [employees, setEmployees] = useState<EmployeeWithSalary[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingEmployees(false);
      return;
    }
    loadEmployees();
  }, [isAuthenticated, tokens]);

  const loadEmployees = async () => {
    if (!tokens) {
      setLoadingEmployees(false);
      return;
    }
    try {
      setLoadingEmployees(true);
      const data = await payrollApi.listEmployeesWithSalary(tokens);
      setEmployees(data);
      // Auto-select employees who have salary assigned
      const employeesWithSalary = data
        .filter(emp => emp.salary !== null)
        .map(emp => emp.employeeId._id);
      setSelectedEmployees(employeesWithSalary);
    } catch (error) {
      console.error("Failed to load employees:", error);
      alert("Failed to load employees");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Only select employees with salary assigned
      const employeesWithSalary = employees
        .filter(emp => emp.salary !== null)
        .map(emp => emp.employeeId._id);
      setSelectedEmployees(employeesWithSalary);
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleRunPayroll = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokens) {
      alert("Please login to continue");
      return;
    }

    if (!periodStart || !periodEnd) {
      alert("Please select period start and end dates");
      return;
    }

    if (selectedEmployees.length === 0) {
      alert("Please select at least one employee to run payroll");
      return;
    }

    try {
      setLoading(true);

      // Build employees array with their salary structure
      const employeesData = selectedEmployees.map(empId => {
        const emp = employees.find(e => e.employeeId._id === empId);
        if (!emp || !emp.salary) {
          throw new Error(`Employee ${empId} does not have an active salary structure`);
        }
        return {
          employeeId: empId,
          baseSalaryMinor: emp.salary.baseSalary, // baseSalary is already in paise from DB
        };
      });

      const run = await payrollApi.startRun({
        periodStart,
        periodEnd,
        employees: employeesData,
      }, tokens);

      alert(`Payslip generated successfully!\nRun ID: ${run._id}\nEmployees: ${employeesData.length}\nStatus: ${run.status}`);
      setPeriodStart("");
      setPeriodEnd("");
      setSelectedEmployees([]);
      loadEmployees(); // Refresh the list
    } catch (error: any) {
      console.error("Payslip generation error:", error);
      alert(error.message || "Failed to generate payslip");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount / 100); // Convert from paise to rupees
  };

  const employeesWithSalary = employees.filter(emp => emp.salary !== null);
  const employeesWithoutSalary = employees.filter(emp => emp.salary === null);

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center gap-3 text-blue-600">
            <AlertCircle className="h-5 w-5" />
            <p>Please login to generate payslips.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleRunPayroll} className="space-y-6">
      {/* Period Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payroll Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Period Start Date</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Period End Date</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                min={periodStart}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loadingEmployees ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading employees...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Warning for employees without salary */}
          {employeesWithoutSalary.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Salary Not Assigned</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {employeesWithoutSalary.length} employee(s) don't have salary assigned. Please assign salary structure first.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Employee Selection Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Employees ({selectedEmployees.length} of {employeesWithSalary.length})
                </CardTitle>
                {employeesWithSalary.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300"
                      onChange={handleSelectAll}
                      checked={selectedEmployees.length === employeesWithSalary.length && employeesWithSalary.length > 0}
                    />
                    <span className="text-sm font-medium">Select All</span>
                  </label>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mr-3" />
                  <span>No active employees found in the organization.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-sm">Select</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Employee Code</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Department</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Designation</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Base Salary</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp) => {
                        const hasSalary = emp.salary !== null;
                        return (
                          <tr key={emp.employeeId._id} className={`border-b hover:bg-muted/50 ${!hasSalary ? "opacity-50" : ""}`}>
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300"
                                checked={selectedEmployees.includes(emp.employeeId._id)}
                                onChange={() => handleSelectEmployee(emp.employeeId._id)}
                                disabled={!hasSalary}
                              />
                            </td>
                            <td className="py-3 px-4 text-sm">{emp.employeeId.employeeCode}</td>
                            <td className="py-3 px-4 text-sm font-medium">
                              {emp.employeeId.personal.firstName} {emp.employeeId.personal.lastName}
                            </td>
                            <td className="py-3 px-4 text-sm">{emp.employeeId.professional.department || '-'}</td>
                            <td className="py-3 px-4 text-sm">{emp.employeeId.professional.title || '-'}</td>
                            <td className="py-3 px-4 text-sm">
                              {hasSalary ? (
                                <span className="font-semibold text-green-600 flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(emp.salary!.baseSalary)}
                                </span>
                              ) : (
                                <span className="text-red-600 font-medium">Not Assigned</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {hasSalary ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <CheckCircle className="h-3 w-3" /> Ready
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                  <AlertCircle className="h-3 w-3" /> No Salary
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={loading || loadingEmployees || selectedEmployees.length === 0}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Generate Payslip for {selectedEmployees.length} Employee(s)
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={loadEmployees}
          disabled={loadingEmployees}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingEmployees ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </form>
  );
}
