"use client";

import { Payslip } from "../../lib/payroll/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, DollarSign, TrendingDown, Eye, FileText } from "lucide-react";

interface PayslipsListProps {
  payslips: Payslip[];
}

export function PayslipsList({ payslips }: PayslipsListProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-center">No payslips found</p>
          <p className="text-sm text-muted-foreground/70 text-center mt-2">
            Payslips will appear here once payroll has been processed
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {payslips.map((payslip) => (
        <Card key={payslip._id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Left Section - Period and Details */}
              <div className="flex-1 space-y-4">
                {/* Period */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Period</p>
                    <p className="font-semibold">
                      {formatDate(payslip.payrollRunId.periodStart)} - {formatDate(payslip.payrollRunId.periodEnd)}
                    </p>
                  </div>
                </div>

                {/* Salary Details Grid */}
                <div className="grid grid-cols-3 gap-6">
                  {/* Gross Salary */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Gross Salary
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(payslip.gross)}
                    </p>
                  </div>

                  {/* Deductions */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Deductions
                    </p>
                    <p className="text-lg font-semibold text-red-600">
                      {formatCurrency(payslip.deductions)}
                    </p>
                  </div>

                  {/* Net Salary */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Net Salary
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(payslip.netRounded)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Section - Action Button */}
              <div className="ml-6">
                <Button
                  onClick={() => handleViewPayslip(payslip._id)}
                  variant="default"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
