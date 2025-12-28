"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { payrollApi } from "../../../../lib/payroll/api";
import { Payslip } from "../../../../lib/payroll/types";
import { useAuth } from "../../../../lib/auth/context";

export default function PayslipDetailPage() {
  const { state } = useAuth();
  const tokens = state.tokens;
  const isAuthenticated = state.status === "authenticated";
  const params = useParams();
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    if (params.id && tokens) {
      loadPayslip(params.id as string);
    }
  }, [params.id, tokens, isAuthenticated]);

  const loadPayslip = async (id: string) => {
    if (!tokens) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Use self-service endpoint that works for all authenticated users
      const data = await payrollApi.getMyPayslip(id, tokens);
      setPayslip(data);
    } catch (error) {
      alert("Failed to load payslip");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount / 100); // Convert from paise to rupees
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-6">Please login to view payslip details.</div>;
  }

  if (!payslip) {
    return <div className="p-6">Payslip not found</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-semibold">Payslip Details</h1>
        <button className="btn btn-primary" onClick={handlePrint}>
          Print / Download
        </button>
      </div>

      <div className="bg-white text-black p-8 rounded-lg shadow-lg space-y-6">
        {/* Header */}
        <div className="text-center border-b pb-4">
          <h2 className="text-2xl font-bold">PAYSLIP</h2>
          <p className="text-sm">Pay Period: {formatDate(payslip.payrollRunId.periodStart)} - {formatDate(payslip.payrollRunId.periodEnd)}</p>
        </div>

        {/* Employee Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Employee Name</p>
            <p className="font-semibold">{payslip.employeeId.personal.firstName} {payslip.employeeId.personal.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Employee Code</p>
            <p className="font-semibold">{payslip.employeeId.employeeCode}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Department</p>
            <p className="font-semibold">{payslip.employeeId.professional?.department || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Designation</p>
            <p className="font-semibold">{payslip.employeeId.professional?.title || 'N/A'}</p>
          </div>
        </div>

        {/* Earnings and Deductions */}
        <div>
          <h3 className="text-lg font-semibold border-b pb-2 mb-2">Salary Components</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Component</th>
                <th className="text-center py-2">Type</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payslip.components.map((component, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{component.name}</td>
                  <td className="text-center">
                    <span className={`badge badge-sm ${
                      component.type === 'earning' ? 'badge-success' : 'badge-error'
                    }`}>
                      {component.type}
                    </span>
                  </td>
                  <td className="text-right">{formatCurrency(component.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between">
            <span className="font-semibold">Gross Salary</span>
            <span>{formatCurrency(payslip.gross)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Total Deductions</span>
            <span>{formatCurrency(payslip.deductions)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold border-t-2 pt-2">
            <span>NET SALARY</span>
            <span>{formatCurrency(payslip.netRounded)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 border-t pt-4">
          <p>This is a system-generated payslip. No signature required.</p>
          <p>Generated on: {formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    </div>
  );
}
