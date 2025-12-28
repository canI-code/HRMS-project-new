"use client";

import { Payslip } from "../../lib/payroll/types";

interface PayslipsListProps {
  payslips: Payslip[];
}

export function PayslipsList({ payslips }: PayslipsListProps) {
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

  const handleViewPayslip = (payslipId: string) => {
    window.open(`/payroll/payslips/${payslipId}`, '_blank');
  };

  if (payslips.length === 0) {
    return (
      <div className="alert alert-info">
        No payslips found. Payslips will appear here once payroll has been processed.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Period</th>
            <th>Gross Salary</th>
            <th>Deductions</th>
            <th>Net Salary</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {payslips.map((payslip) => (
            <tr key={payslip._id}>
              <td>
                {formatDate(payslip.payrollRunId.periodStart)} - {formatDate(payslip.payrollRunId.periodEnd)}
              </td>
              <td>{formatCurrency(payslip.gross)}</td>
              <td>{formatCurrency(payslip.deductions)}</td>
              <td className="font-semibold">{formatCurrency(payslip.netRounded)}</td>
              <td>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => handleViewPayslip(payslip._id)}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
