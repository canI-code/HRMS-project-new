"use client";

import Link from "next/link";
import { Protected } from "@/components/auth/Protected";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function PayrollHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payroll Management</h1>
        <p className="text-muted-foreground">Manage specific payroll tasks and view reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Protected roles={["hr_admin", "super_admin"]}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Salary Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Define and manage salary components and structures.</p>
              <Link href="/payroll/structure">
                <Button className="w-full">Manage Structure</Button>
              </Link>
            </CardContent>
          </Card>
        </Protected>

        <Protected roles={["hr_admin", "super_admin"]}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Assign Salary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Assign salary structures to employees.</p>
              <Link href="/payroll/assign">
                <Button className="w-full" variant="secondary">Assign Salary</Button>
              </Link>
            </CardContent>
          </Card>
        </Protected>

        <Protected roles={["hr_admin", "super_admin"]}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Run Payroll</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Process monthly payroll and generate slips.</p>
              <Link href="/payroll/run">
                <Button className="w-full" variant="default">Run Payroll</Button>
              </Link>
            </CardContent>
          </Card>
        </Protected>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">My Payslips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">View and download your monthly payslips.</p>
            <Link href="/payroll/payslips">
              <Button className="w-full" variant="outline">View Payslips</Button>
            </Link>
          </CardContent>
        </Card>

        <Protected roles={["hr_admin", "super_admin"]}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">View detailed payroll reports and analytics.</p>
              <Link href="/payroll/reports">
                <Button className="w-full" variant="ghost">View Reports</Button>
              </Link>
            </CardContent>
          </Card>
        </Protected>
      </div>
    </div>
  );
}
