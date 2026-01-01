"use client";

import { useState } from "react";
import { SalaryStructure, StructureComponent } from "../../lib/payroll/types";
import { payrollApi } from "../../lib/payroll/api";
import { useAuth } from "../../lib/auth/context";
import {
  Plus,
  Trash2,
  Info,
  Save,
  Wallet,
  MinusCircle,
  ChevronRight,
  Search,
  IndianRupee,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

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
      alert(error.message || "Failed to create salary structure");
    }
  };

  return (
    <div className="space-y-10 pb-10">
      {currentStructure && (
        <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/5 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-white/50 backdrop-blur-sm px-6 py-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 uppercase tracking-wider text-[10px]">
                  Active Version {currentStructure.version}
                </Badge>
                {currentStructure.name}
              </CardTitle>
              <CardDescription>Currently being used for all payroll calculations</CardDescription>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Total Components</span>
              <span className="text-2xl font-black text-indigo-600 leading-none">{currentStructure.components.length}</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-zinc-100 shadow-sm">
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Earnings</p>
                  <p className="text-lg font-bold">
                    {currentStructure.components.filter(c => c.type === 'earning').length} Items
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-zinc-100 shadow-sm">
                <div className="p-3 rounded-lg bg-rose-50 text-rose-600">
                  <MinusCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Deductions</p>
                  <p className="text-lg font-bold">
                    {currentStructure.components.filter(c => c.type === 'deduction').length} Items
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-zinc-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-zinc-50 px-4 text-sm font-bold text-zinc-400 uppercase tracking-widest">
            {currentStructure ? 'Create New Version' : 'Setup Initial Structure'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="border-none shadow-xl shadow-indigo-100/50">
          <CardContent className="p-8">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                Structure Name <span className="text-rose-500">*</span>
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-indigo-500 transition-colors">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  className="pl-10 h-12 bg-zinc-50/50 border-zinc-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all text-base"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Standard Structure 2024"
                  required
                />
              </div>
              <p className="text-[11px] text-zinc-400 italic">This will be the reference name for this payroll configuration version.</p>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Components */}
        <div className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <div className="space-y-1">
              <h3 className="text-xl font-black tracking-tight text-zinc-800 flex items-center gap-2">
                Earnings <Badge className="bg-emerald-500 hover:bg-emerald-600">{earningsComponents.length}</Badge>
              </h3>
              <p className="text-sm text-zinc-500 font-medium">Income components like Basic, HRA, and Allowances</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold"
              onClick={addEarningsComponent}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Component
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {earningsComponents.map((component, index) => (
              <Card key={index} className="group border shadow-sm border-zinc-100 hover:border-emerald-200 transition-all hover:shadow-md hover:shadow-emerald-500/5">
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
                    <div className="lg:col-span-4 space-y-2">
                      <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Name & Code</Label>
                      <div className="flex gap-2">
                        <Input
                          className="h-10 text-sm font-semibold border-zinc-100 focus:ring-emerald-500/10"
                          value={component.name}
                          onChange={(e) => updateEarningsComponent(index, "name", e.target.value)}
                          placeholder="Basic Salary"
                          required
                        />
                        <Input
                          className="h-10 w-24 text-center font-mono text-xs font-bold bg-zinc-50 uppercase border-dashed border-zinc-300"
                          value={component.code}
                          onChange={(e) => updateEarningsComponent(index, "code", e.target.value.toUpperCase())}
                          placeholder="BASIC"
                          required
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-3 space-y-2">
                      <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Calculation Method</Label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-zinc-100 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none bg-zinc-50/50 hover:bg-white transition-colors cursor-pointer"
                        value={component.calculationType}
                        onChange={(e) => updateEarningsComponent(index, "calculationType", e.target.value)}
                      >
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">% of Basic</option>
                      </select>
                    </div>

                    <div className="lg:col-span-3 space-y-2">
                      <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">
                        {component.calculationType === "fixed" ? "Monthly Amount" : "Percentage Weight"}
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          {component.calculationType === "fixed" ? <IndianRupee className="h-3 w-3 text-zinc-400" /> : <span className="text-xs font-bold text-zinc-400">%</span>}
                        </div>
                        <Input
                          type="number"
                          className="pl-8 h-10 font-bold text-zinc-700"
                          value={component.value}
                          onChange={(e) => updateEarningsComponent(index, "value", e.target.value)}
                          min="0"
                          step={component.calculationType === "percentage" ? "0.01" : "1"}
                          required
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-2 flex justify-end pb-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        onClick={() => removeEarningsComponent(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Deductions Components */}
        <div className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <div className="space-y-1">
              <h3 className="text-xl font-black tracking-tight text-zinc-800 flex items-center gap-2">
                Deductions <Badge className="bg-rose-500 hover:bg-rose-600">{deductionsComponents.length}</Badge>
              </h3>
              <p className="text-sm text-zinc-500 font-medium">Outgoings like PF, PT, and Income Tax (TDS)</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold"
              onClick={addDeductionsComponent}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Component
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {deductionsComponents.map((component, index) => (
              <Card key={index} className="group border shadow-sm border-zinc-100 hover:border-rose-200 transition-all hover:shadow-md hover:shadow-rose-500/5">
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    <div className="lg:col-span-10">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Name & Code</Label>
                          <div className="flex gap-2">
                            <Input
                              className="h-10 text-sm font-semibold border-zinc-100 focus:ring-rose-500/10"
                              value={component.name}
                              onChange={(e) => updateDeductionsComponent(index, "name", e.target.value)}
                              placeholder="Provident Fund"
                              required
                            />
                            <Input
                              className="h-10 w-24 text-center font-mono text-xs font-bold bg-zinc-50 uppercase border-dashed border-zinc-300"
                              value={component.code}
                              onChange={(e) => updateDeductionsComponent(index, "code", e.target.value.toUpperCase())}
                              placeholder="PF"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Calculation Method</Label>
                          <select
                            className="w-full h-10 px-3 rounded-md border border-zinc-100 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 outline-none appearance-none bg-zinc-50/50 hover:bg-white transition-colors cursor-pointer"
                            value={component.calculationType}
                            onChange={(e) => updateDeductionsComponent(index, "calculationType", e.target.value)}
                          >
                            <option value="fixed">Fixed Amount</option>
                            <option value="percentage">% of Gross</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1 font-inherit">
                            {component.calculationType === "fixed" ? "Monthly Amount" : "Percentage Weight"}
                          </Label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              {component.calculationType === "fixed" ? <IndianRupee className="h-3 w-3 text-zinc-400" /> : <span className="text-xs font-bold text-zinc-400">%</span>}
                            </div>
                            <Input
                              type="number"
                              className="pl-8 h-10 font-bold text-zinc-700"
                              value={component.value}
                              onChange={(e) => updateDeductionsComponent(index, "value", e.target.value)}
                              min="0"
                              step={component.calculationType === "percentage" ? "0.01" : "1"}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-zinc-50">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 max-w-[240px]">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Max Cap Amount (Monthly)
                            </Label>
                            <div className="relative mt-1">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IndianRupee className="h-3 w-3 text-zinc-400" />
                              </div>
                              <Input
                                type="number"
                                className="pl-8 h-9 text-xs bg-zinc-50/50 border-none"
                                value={component.capAmount || ""}
                                onChange={(e) => updateDeductionsComponent(index, "capAmount", e.target.value)}
                                placeholder="No limit"
                                min="0"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-5 italic">Deduction will not exceed this amount even if calculated % is higher.</p>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 flex justify-end lg:pt-8 pb-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-zinc-300 hover:text-rose-500 hover:bg-rose-100 transition-colors"
                        onClick={() => removeDeductionsComponent(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center pt-10 border-t border-dashed border-zinc-200">
          <Button
            type="submit"
            size="lg"
            className="h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-bold text-lg min-w-[300px]"
          >
            <Save className="h-5 w-5 mr-3" /> Create New Version
          </Button>
          <p className="mt-4 text-sm text-zinc-400 font-medium">Confirming will activate this structure for all new payroll runs.</p>
        </div>
      </form>
    </div>
  );
};
