"use client";

import { useState, useEffect } from "react";
import { Protected } from "../../../components/auth/Protected";
import { SalaryStructureBuilder } from "../../../components/payroll/SalaryStructureBuilder";
import { payrollApi } from "../../../lib/payroll/api";
import { SalaryStructure } from "../../../lib/payroll/types";
import { useAuth } from "../../../lib/auth/context";

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
      if (error.response?.status === 404) {
        setActiveStructure(null);
      } else {
        setError(error.response?.data?.message || "Failed to load active structure");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Protected roles={["hr_admin", "super_admin"]}>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Salary Structure Management</h1>
        {loading ? (
          <div>Loading...</div>
        ) : !isAuthenticated ? (
          <div className="alert alert-info">Please login to manage salary structures.</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <SalaryStructureBuilder 
            currentStructure={activeStructure}
            onSave={loadActiveStructure}
          />
        )}
      </div>
    </Protected>
  );
}
