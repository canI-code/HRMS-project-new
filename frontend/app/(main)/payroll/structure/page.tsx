"use client";

import { useState, useEffect } from "react";
import { Protected } from "@/components/auth/Protected";
import { SalaryStructureBuilder } from "@/components/payroll/SalaryStructureBuilder";
import { payrollApi } from "@/lib/payroll/api";
import { SalaryStructure } from "@/lib/payroll/types";
import { useAuth } from "@/lib/auth/context";

import { WalletCards, AlertCircle, Loader2 } from "lucide-react";

export default function SalaryStructurePage() {
  const { state } = useAuth();
  const tokens = state.tokens;
  const isAuthenticated = state.status === "authenticated";
  const [activeStructure, setActiveStructure] = useState<SalaryStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadActiveStructure();
  }, [isAuthenticated, tokens]);

  const loadActiveStructure = async () => {
    if (!tokens) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const structure = await payrollApi.getActiveStructure(tokens);
      setActiveStructure(structure);
    } catch (error: any) {
      if (error.status === 404) {
        setActiveStructure(null);
      } else {
        setError(error.message || "Failed to load active structure");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Protected roles={["hr_admin", "super_admin"]}>
      <div className="max-w-7xl mx-auto p-8 space-y-10">
        <header className="flex flex-col gap-2 border-b border-zinc-100 pb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <WalletCards className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-zinc-900">Salary Structure</h1>
              <p className="text-zinc-500 font-medium">Configure organization-wide earnings, deductions, and tax rules.</p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Fetching configuration...</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="p-10 rounded-3xl bg-amber-50 border border-amber-100 flex flex-col items-center text-center gap-4">
            <AlertCircle className="h-10 w-10 text-amber-500" />
            <p className="text-amber-900 font-bold">Session required to access payroll settings.</p>
          </div>
        ) : error ? (
          <div className="p-10 rounded-3xl bg-rose-50 border border-rose-100 flex flex-col items-center text-center gap-4">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <div className="space-y-1">
              <p className="text-rose-900 font-bold">Synchronization Error</p>
              <p className="text-rose-600/80 text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={loadActiveStructure}
              className="mt-2 px-6 py-2 bg-rose-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <SalaryStructureBuilder
              currentStructure={activeStructure}
              onSave={loadActiveStructure}
            />
          </div>
        )}
      </div>
    </Protected>
  );
}
