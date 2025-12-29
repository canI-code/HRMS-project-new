"use client";

import { useState, useEffect } from "react";
import { payrollApi } from "../../lib/payroll/api";
import { useAuth } from "../../lib/auth/context";
import { EmployeeWithSalary } from "../../lib/payroll/types";

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
          baseSalary: emp.salary.baseSalary, // baseSalary is already in paise from DB
        };
      });

      const run = await payrollApi.startRun({
        periodStart,
        periodEnd,
        employees: employeesData,
      }, tokens);

      alert(`Payroll run created successfully!\nRun ID: ${run._id}\nEmployees: ${employeesData.length}\nStatus: ${run.status}`);
      setPeriodStart("");
      setPeriodEnd("");
      setSelectedEmployees([]);
      loadEmployees(); // Refresh the list
    } catch (error: any) {
      console.error("Payroll run error:", error);
      alert(error.message || error.response?.data?.message || "Failed to run payroll");
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
      <div className="alert alert-info">
        Please login to run payroll.
      </div>
    );
  }

  return (
    <form onSubmit={handleRunPayroll} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Period Start Date</span>
          </label>
          <input
            type="date"
            className="input input-bordered"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            required
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Period End Date</span>
          </label>
          <input
            type="date"
            className="input input-bordered"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            min={periodStart}
            required
          />
        </div>
      </div>

      {loadingEmployees ? (
        <div className="text-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-2">Loading employees...</p>
        </div>
      ) : (
        <>
          {employeesWithoutSalary.length > 0 && (
            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{employeesWithoutSalary.length} employee(s) don't have salary assigned. Please assign salary structure first.</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Select Employees ({selectedEmployees.length} of {employeesWithSalary.length})
              </h3>
              {employeesWithSalary.length > 0 && (
                <div className="form-control">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      onChange={handleSelectAll}
                      checked={selectedEmployees.length === employeesWithSalary.length && employeesWithSalary.length > 0}
                    />
                    <span className="label-text">Select All</span>
                  </label>
                </div>
              )}
            </div>

            {employees.length === 0 ? (
              <div className="alert alert-info">
                <span>No active employees found in the organization.</span>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Employee Code</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Base Salary</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => {
                      const hasSalary = emp.salary !== null;
                      return (
                        <tr key={emp.employeeId._id} className={!hasSalary ? "opacity-50" : ""}>
                          <td>
                            <input
                              type="checkbox"
                              className="checkbox checkbox-primary"
                              checked={selectedEmployees.includes(emp.employeeId._id)}
                              onChange={() => handleSelectEmployee(emp.employeeId._id)}
                              disabled={!hasSalary}
                            />
                          </td>
                          <td>{emp.employeeId.employeeCode}</td>
                          <td>
                            {emp.employeeId.personal.firstName} {emp.employeeId.personal.lastName}
                          </td>
                          <td>{emp.employeeId.professional.department || '-'}</td>
                          <td>{emp.employeeId.professional.title || '-'}</td>
                          <td>
                            {hasSalary ? (
                              <span className="font-semibold">{formatCurrency(emp.salary!.baseSalary)}</span>
                            ) : (
                              <span className="text-error">Not Assigned</span>
                            )}
                          </td>
                          <td>
                            {hasSalary ? (
                              <span className="badge badge-success">Ready</span>
                            ) : (
                              <span className="badge badge-warning">No Salary</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || loadingEmployees || selectedEmployees.length === 0}
        >
          {loading ? (
            <>
              <span className="loading loading-spinner"></span>
              Processing...
            </>
          ) : (
            `Run Payroll for ${selectedEmployees.length} Employee(s)`
          )}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={loadEmployees}
          disabled={loadingEmployees}
        >
          Refresh
        </button>
      </div>
    </form>
  );
}
