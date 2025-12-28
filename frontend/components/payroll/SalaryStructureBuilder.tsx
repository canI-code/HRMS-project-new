"use client";

import { useState } from "react";
import { SalaryStructure, StructureComponent } from "../../lib/payroll/types";
import { payrollApi } from "../../lib/payroll/api";
import { useAuth } from "../../lib/auth/context";

interface SalaryStructureBuilderProps {
  currentStructure: SalaryStructure | null;
  onSave: () => void;
}

export function SalaryStructureBuilder({ currentStructure, onSave }: SalaryStructureBuilderProps) {
  const { state } = useAuth();
  const tokens = state.tokens;
  const isAuthenticated = state.status === "authenticated";
  const [name, setName] = useState("");
  const [earningsComponents, setEarningsComponents] = useState<StructureComponent[]>([
    { name: "Basic Salary", code: "BASIC", type: "earning", calculationType: "fixed", value: 0 },
    { name: "House Rent Allowance (HRA)", code: "HRA", type: "earning", calculationType: "percentage", value: 40 },
    { name: "Special Allowance", code: "SPECIAL", type: "earning", calculationType: "percentage", value: 20 },
  ]);
  const [deductionsComponents, setDeductionsComponents] = useState<StructureComponent[]>([
    { name: "Provident Fund (PF)", code: "PF", type: "deduction", calculationType: "percentage", value: 12, capAmount: 180000 },
    { name: "Professional Tax", code: "PT", type: "deduction", calculationType: "fixed", value: 200 },
    { name: "Income Tax (TDS)", code: "TDS", type: "deduction", calculationType: "percentage", value: 10 },
  ]);

  const addEarningsComponent = () => {
    setEarningsComponents([...earningsComponents, { 
      name: "", 
      code: "",
      type: "earning", 
      calculationType: "fixed", 
      value: 0,
    }]);
  };

  const addDeductionsComponent = () => {
    setDeductionsComponents([...deductionsComponents, { 
      name: "", 
      code: "",
      type: "deduction", 
      calculationType: "fixed", 
      value: 0,
    }]);
  };

  const updateEarningsComponent = (index: number, field: string, value: any) => {
    const updated = [...earningsComponents];
    if (field === "value") {
      value = parseFloat(value) || 0;
    }
    if (field === "capAmount") {
      value = value ? parseFloat(value) : undefined;
    }
    updated[index] = { ...updated[index], [field]: value };
    setEarningsComponents(updated);
  };

  const updateDeductionsComponent = (index: number, field: string, value: any) => {
    const updated = [...deductionsComponents];
    if (field === "value") {
      value = parseFloat(value) || 0;
    }
    if (field === "capAmount") {
      value = value ? parseFloat(value) : undefined;
    }
    updated[index] = { ...updated[index], [field]: value };
    setDeductionsComponents(updated);
  };

  const removeEarningsComponent = (index: number) => {
    setEarningsComponents(earningsComponents.filter((_, i) => i !== index));
  };

  const removeDeductionsComponent = (index: number) => {
    setDeductionsComponents(deductionsComponents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !tokens) {
      alert("Please login to continue");
      return;
    }
    try {
      await payrollApi.createStructure({
        name,
        effectiveFrom: new Date().toISOString(),
        components: [...earningsComponents, ...deductionsComponents]
      }, tokens);
      alert("Salary structure created successfully");
      setName("");
      onSave();
    } catch (error: any) {
      console.error("Failed to create structure:", error);
      alert(error.response?.data?.message || "Failed to create salary structure");
    }
  };

  return (
    <div className="space-y-6">
      {currentStructure && (
        <div className="alert alert-info">
          <div>
            <h3 className="font-semibold">Current Active Structure</h3>
            <p><strong>Name:</strong> {currentStructure.name} (v{currentStructure.version})</p>
            <p><strong>Components:</strong> {currentStructure.components.length}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Structure Name *</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Standard Structure 2024"
            required
          />
        </div>

        {/* Earnings Components */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Earnings Components</h3>
            <button type="button" className="btn btn-sm btn-primary" onClick={addEarningsComponent}>
              + Add Earnings
            </button>
          </div>
          {earningsComponents.map((component, index) => (
            <div key={index} className="card bg-base-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Name *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={component.name}
                    onChange={(e) => updateEarningsComponent(index, "name", e.target.value)}
                    placeholder="e.g., HRA, Bonus"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Code *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={component.code}
                    onChange={(e) => updateEarningsComponent(index, "code", e.target.value.toUpperCase())}
                    placeholder="e.g., HRA"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Type *</span>
                  </label>
                  <select
                    className="select select-bordered select-sm"
                    value={component.calculationType}
                    onChange={(e) => updateEarningsComponent(index, "calculationType", e.target.value)}
                  >
                    <option value="fixed">Fixed</option>
                    <option value="percentage">% of Basic</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{component.calculationType === "fixed" ? "Amount (₹)" : "Percentage (%)"} *</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered input-sm"
                    value={component.value}
                    onChange={(e) => updateEarningsComponent(index, "value", e.target.value)}
                    min="0"
                    step={component.calculationType === "percentage" ? "0.01" : "1"}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Action</span>
                  </label>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-error"
                    onClick={() => removeEarningsComponent(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Deductions Components */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Deductions Components</h3>
            <button type="button" className="btn btn-sm btn-secondary" onClick={addDeductionsComponent}>
              + Add Deduction
            </button>
          </div>
          {deductionsComponents.map((component, index) => (
            <div key={index} className="card bg-base-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Name *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={component.name}
                    onChange={(e) => updateDeductionsComponent(index, "name", e.target.value)}
                    placeholder="e.g., PF, PT"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Code *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={component.code}
                    onChange={(e) => updateDeductionsComponent(index, "code", e.target.value.toUpperCase())}
                    placeholder="e.g., PF"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Type *</span>
                  </label>
                  <select
                    className="select select-bordered select-sm"
                    value={component.calculationType}
                    onChange={(e) => updateDeductionsComponent(index, "calculationType", e.target.value)}
                  >
                    <option value="fixed">Fixed</option>
                    <option value="percentage">% of Gross</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{component.calculationType === "fixed" ? "Amount (₹)" : "Percentage (%)"} *</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered input-sm"
                    value={component.value}
                    onChange={(e) => updateDeductionsComponent(index, "value", e.target.value)}
                    min="0"
                    step={component.calculationType === "percentage" ? "0.01" : "1"}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Action</span>
                  </label>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-error"
                    onClick={() => removeDeductionsComponent(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-2">
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Cap Amount (₹)</span>
                    <span className="label-text-alt">Optional</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered input-sm"
                    value={component.capAmount || ""}
                    onChange={(e) => updateDeductionsComponent(index, "capAmount", e.target.value)}
                    placeholder="Max deduction amount"
                    min="0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-primary btn-lg">
          Create New Structure Version
        </button>
      </form>
    </div>
  );
}
