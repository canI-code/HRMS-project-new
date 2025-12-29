"use client";

import Link from "next/link";
import { Protected } from "@/components/auth/Protected";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function LeaveHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
        <p className="text-muted-foreground">Manage leave requests and policies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Request Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Apply for new leave.</p>
            <Link href="/leave/request">
              <Button className="w-full">Request Leave</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">My Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">View your leave history and status.</p>
            <Link href="/leave/my-leaves">
              <Button variant="secondary" className="w-full">View My Leaves</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Leave Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Check team availability.</p>
            <Link href="/leave/calendar">
              <Button variant="outline" className="w-full">View Calendar</Button>
            </Link>
          </CardContent>
        </Card>

        <Protected roles={["manager", "hr_admin", "super_admin"]}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Team Leaves</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Monitor team leave usage.</p>
              <Link href="/leave/team">
                <Button variant="ghost" className="w-full">View Team Leaves</Button>
              </Link>
            </CardContent>
          </Card>
        </Protected>

        <Protected roles={["manager", "hr_admin", "super_admin"]}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Process pending leave requests.</p>
              <Link href="/leave/approvals">
                <Button variant="default" className="w-full">Pending Approvals</Button>
              </Link>
            </CardContent>
          </Card>
        </Protected>

        <Protected roles={["hr_admin", "super_admin"]}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Leave Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Configure leave types and rules.</p>
              <Link href="/leave/policy">
                <Button variant="outline" className="w-full">Configure Policy</Button>
              </Link>
            </CardContent>
          </Card>
        </Protected>
      </div>
    </div>
  );
}
