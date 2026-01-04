"use client";

import { useState, useEffect } from "react";
import { PayslipsList } from "@/components/payroll/PayslipsList";
import { payrollApi } from "@/lib/payroll/api";
import { Payslip } from "@/lib/payroll/types";
import { useAuth } from "@/lib/auth/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FileText, Loader2 } from "lucide-react";

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
      console.error("Failed to load payslips", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Payslips</h1>
        <p className="text-muted-foreground mt-2">View and download your salary payslips</p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading payslips...</p>
            </div>
          </CardContent>
        </Card>
      ) : !isAuthenticated ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-sm text-muted-foreground">Please login to view payslips.</p>
          </CardContent>
        </Card>
      ) : payslips.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-center">No payslips available yet</p>
          </CardContent>
        </Card>
      ) : (
        <PayslipsList payslips={payslips} />
      )}
    </div>
  );
}
