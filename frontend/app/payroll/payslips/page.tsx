"use client";

import { useState, useEffect } from "react";
import { PayslipsList } from "../../../components/payroll/PayslipsList";
import { payrollApi } from "../../../lib/payroll/api";
import { Payslip } from "../../../lib/payroll/types";
import { useAuth } from "../../../lib/auth/context";

export default function PayslipsPage() {
  const { state } = useAuth();
  const tokens = state.tokens;
  const isAuthenticated = state.status === "authenticated";
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadPayslips();
  }, [isAuthenticated, tokens]);

  const loadPayslips = async () => {
    if (!tokens) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await payrollApi.listMyPayslips(tokens);
      setPayslips(data);
    } catch (error) {
      alert("Failed to load payslips");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">My Payslips</h1>
      {loading ? (
        <div>Loading...</div>
      ) : !isAuthenticated ? (
        <div className="alert alert-info">Please login to view payslips.</div>
      ) : (
        <PayslipsList payslips={payslips} />
      )}
    </div>
  );
}
