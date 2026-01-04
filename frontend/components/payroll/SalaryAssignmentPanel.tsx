"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth/context";
import { payrollApi } from "../../lib/payroll/api";
import { EmployeeWithSalary, SalaryStructure } from "../../lib/payroll/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User, DollarSign, Calendar, FileText, Loader2, AlertCircle, CheckCircle, Briefcase, RefreshCw } from "lucide-react";

export function SalaryAssignmentPanel() {
  const { state } = useAuth();
  const tokens = state.tokens;
  const isAuthenticated = state.status === "authenticated";
  const [employees, setEmployees] = useState<EmployeeWithSalary[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedStructure, setSelectedStructure] = useState<string>("");
  const [baseSalary, setBaseSalary] = useState<string>("");
  const [effectiveFrom, setEffectiveFrom] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingData(false);
      return;
    }
    loadData();
  }, [isAuthenticated, tokens]);

  const loadData = async () => {
    if (!tokens) {
      setLoadingData(false);
      return;
    }
    try {
      setLoadingData(true);
      const [employeesData, activeStructure] = await Promise.all([
        payrollApi.listEmployeesWithSalary(tokens),
        payrollApi.getActiveStructure(tokens).catch(() => null),
      ]);
      setEmployees(employeesData);
      if (activeStructure) {
        setStructures([activeStructure]);
        setSelectedStructure(activeStructure._id);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      alert("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokens) {
      alert("Please login to continue");
      return;
    }

    if (!selectedEmployee || !selectedStructure || !baseSalary) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      // Convert rupees to paise (minor units)
      const baseSalaryInPaise = parseFloat(baseSalary) * 100;

      await payrollApi.assignSalary({
        employeeId: selectedEmployee,
        salaryStructureId: selectedStructure,
        baseSalary: baseSalaryInPaise,
        effectiveFrom,
        remarks,
      }, tokens);

      alert("Salary assigned successfully!");

      // Reset form
      setSelectedEmployee("");
      setBaseSalary("");
      setRemarks("");

      // Reload employees
      loadData();
    } catch (error: any) {
      console.error("Failed to assign salary:", error);
      alert(error.message || "Failed to assign salary");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const selectedEmployeeData = employees.find(emp => emp.employeeId._id === selectedEmployee);

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center gap-3 text-blue-600">
            <AlertCircle className="h-5 w-5" />
            <p>Please login to manage salary assignments.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadingData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (structures.length === 0) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="py-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">No Salary Structure Found</p>
              <p className="text-sm text-yellow-700 mt-2">
                Please create a salary structure first before assigning salaries.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assignment Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Assign Salary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Select Employee *
              </label>
              <select
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                required
              >
                <option value="">Choose an employee</option>
                {employees.map((emp) => (
                  <option key={emp.employeeId._id} value={emp.employeeId._id}>
                    {emp.employeeId.employeeCode} - {emp.employeeId.personal.firstName} {emp.employeeId.personal.lastName}
                    {emp.salary && " (Already has salary)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Employee Details Display */}
            {selectedEmployeeData && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Employee Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-medium">{selectedEmployeeData.employeeId.professional.department || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Designation</p>
                      <p className="font-medium">{selectedEmployeeData.employeeId.professional.title || 'N/A'}</p>
                    </div>
                    {selectedEmployeeData.salary && (
                      <>
                        <div>
                          <p className="text-muted-foreground">Current Base Salary</p>
                          <p className="font-semibold text-green-600">{formatCurrency(selectedEmployeeData.salary.baseSalary)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Current Structure</p>
                          <p className="font-medium">{selectedEmployeeData.salary.salaryStructureId.name}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Salary Structure *
                </label>
                <select
                  className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedStructure}
                  onChange={(e) => setSelectedStructure(e.target.value)}
                  required
                >
                  {structures.map((structure) => (
                    <option key={structure._id} value={structure._id}>
                      {structure.name} (v{structure.version})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Base Salary (₹) *
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  placeholder="e.g., 50000"
                  min="0"
                  step="100"
                  required
                />
                <p className="text-xs text-muted-foreground">Monthly base salary in rupees</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Effective From *
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Remarks
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Assign Salary
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={loadData}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Employees List Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Employees Salary Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-sm">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Base Salary</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Structure</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.employeeId._id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm">{emp.employeeId.employeeCode}</td>
                    <td className="py-3 px-4 text-sm font-medium">
                      {emp.employeeId.personal.firstName} {emp.employeeId.personal.lastName}
                    </td>
                    <td className="py-3 px-4 text-sm">{emp.employeeId.professional.department || '-'}</td>
                    <td className="py-3 px-4 text-sm">
                      {emp.salary ? (
                        <span className="font-semibold text-green-600 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(emp.salary.baseSalary)}
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">Not Assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {emp.salary ? (
                        <span className="text-xs">{emp.salary.salaryStructureId.name} (v{emp.salary.salaryStructureId.version})</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {emp.salary ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          <AlertCircle className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
