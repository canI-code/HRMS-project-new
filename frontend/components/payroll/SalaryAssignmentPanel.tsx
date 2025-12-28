"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth/context";
import { payrollApi } from "../../lib/payroll/api";
import { EmployeeWithSalary, SalaryStructure } from "../../lib/payroll/types";

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
      alert(error.response?.data?.message || "Failed to assign salary");
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
      <div className="alert alert-info">
        Please login to manage salary assignments.
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="text-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="mt-2">Loading...</p>
      </div>
    );
  }

  if (structures.length === 0) {
    return (
      <div className="alert alert-warning">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>No salary structure found. Please create a salary structure first before assigning salaries.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="card bg-base-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Assign Salary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control col-span-2">
            <label className="label">
              <span className="label-text font-semibold">Select Employee *</span>
            </label>
            <select
              className="select select-bordered"
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

          {selectedEmployeeData && (
            <div className="col-span-2 bg-base-300 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Employee Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><strong>Department:</strong> {selectedEmployeeData.employeeId.professional.department || 'N/A'}</p>
                <p><strong>Designation:</strong> {selectedEmployeeData.employeeId.professional.title || 'N/A'}</p>
                {selectedEmployeeData.salary && (
                  <>
                    <p><strong>Current Base Salary:</strong> {formatCurrency(selectedEmployeeData.salary.baseSalary)}</p>
                    <p><strong>Current Structure:</strong> {selectedEmployeeData.salary.salaryStructureId.name}</p>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Salary Structure *</span>
            </label>
            <select
              className="select select-bordered"
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

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Base Salary (₹) *</span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              placeholder="e.g., 50000"
              min="0"
              step="100"
              required
            />
            <label className="label">
              <span className="label-text-alt">Monthly base salary in rupees</span>
            </label>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Effective From *</span>
            </label>
            <input
              type="date"
              className="input input-bordered"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Remarks</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner"></span>
                Assigning...
              </>
            ) : (
              "Assign Salary"
            )}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={loadData}
          >
            Refresh
          </button>
        </div>
      </form>

      {/* Employees List */}
      <div className="card bg-base-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Employees Salary Status</h2>
        
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Department</th>
                <th>Base Salary</th>
                <th>Structure</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.employeeId._id}>
                  <td>{emp.employeeId.employeeCode}</td>
                  <td>{emp.employeeId.personal.firstName} {emp.employeeId.personal.lastName}</td>
                  <td>{emp.employeeId.professional.department || '-'}</td>
                  <td>
                    {emp.salary ? (
                      <span className="font-semibold">{formatCurrency(emp.salary.baseSalary)}</span>
                    ) : (
                      <span className="text-error">Not Assigned</span>
                    )}
                  </td>
                  <td>
                    {emp.salary ? (
                      <span className="text-sm">{emp.salary.salaryStructureId.name} (v{emp.salary.salaryStructureId.version})</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {emp.salary ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-warning">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
