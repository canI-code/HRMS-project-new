"use client";

import Link from "next/link";
import { Protected } from "@/components/auth/Protected";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AttendanceHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">Track daily attendance and monthly records.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Check In</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Record your daily entry time.</p>
            <Link href="/attendance/check-in">
              <Button className="w-full">Check In</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Check Out</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Record your daily exit time.</p>
            <Link href="/attendance/check-out">
              <Button variant="secondary" className="w-full">Check Out</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">View attendance logs for the month.</p>
            <Link href="/attendance/monthly">
              <Button variant="outline" className="w-full">View Summary</Button>
            </Link>
          </CardContent>
        </Card>

        <Protected roles={["hr_admin", "super_admin"]}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Policy Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Configure attendance rules.</p>
              <Link href="/attendance/policy">
                <Button variant="ghost" className="w-full">Configure Policy</Button>
              </Link>
            </CardContent>
          </Card>
        </Protected>
      </div>
    </div>
  );
}
