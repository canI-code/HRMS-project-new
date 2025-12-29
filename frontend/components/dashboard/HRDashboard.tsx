"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { payrollApi } from "@/lib/payroll/api";
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

type Summary = {
  totalEmployees: number;
  workingDays: number;
  payrollProcessed: number;
  payrollTarget: number;
};

export default function HRDashboard() {
  const { state } = useAuth();
  const tokens = state.tokens;
  const user = state.user;

  const [payrollCount, setPayrollCount] = useState<number>(0);
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Compute working days for current month (Mon-Fri)
  const workingDays = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    let days = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const wd = d.getDay();
      if (wd !== 0 && wd !== 6) days++;
    }
    return days;
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!tokens) return;
      setLoading(true);
      setError(null);
      try {
        const summary = await payrollApi.getPayrollSummary(tokens, {});
        setPayrollCount(summary.totalPayslips);
        try {
          const mod = await import("@/lib/employees/api");
          const res = await mod.employeeApi.list({ page: 1, limit: 1 }, tokens);
          const total = (res as any)?.total ?? (res as any)?.meta?.total ?? (res as any)?.count ?? 0;
          setEmployeeCount(typeof total === "number" ? total : 0);
        } catch {
          setEmployeeCount(Math.max(summary.totalPayslips, 0));
        }
      } catch (e) {
        // setError(e instanceof Error ? e.message : "Failed to load dashboard data");
        // Silently fail for dashboard demo purposes if API not ready
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tokens]);

  const meta: Summary = {
    totalEmployees: employeeCount || 12, // Mock data if 0 for visual
    workingDays,
    payrollProcessed: payrollCount || 45,
    payrollTarget: Math.max(employeeCount, payrollCount || 50),
  };

  const now = new Date();
  const greetings = () => {
    const curHr = now.getHours();
    if (curHr < 12) return "Good Morning";
    if (curHr < 18) return "Good Afternoon";
    return "Good Evening";
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">
            {greetings()}, {user?.name || "Admin"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening in your organization today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <TrendingUp className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meta.totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500 font-medium">+20%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payroll Processed</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meta.payrollProcessed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((meta.payrollProcessed / meta.payrollTarget) * 100)}% of target
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-violet-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Working Days</CardTitle>
            <Calendar className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meta.workingDays}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In current month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Content Area */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recruitment Pipeline</CardTitle>
            <CardDescription>Review recent interview activity and statuses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Sarah Johnson", role: "Senior Developer", status: "completed", time: "2h ago" },
                { name: "Michael Chen", role: "Product Manager", status: "in-progress", time: "4h ago" },
                { name: "Jessica Brown", role: "UX Designer", status: "scheduled", time: "Tomorrow" },
                { name: "David Kim", role: "DevOps Engineer", status: "scheduled", time: "Wed, 2:00 PM" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg hover:bg-muted/60 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>{item.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                    <Badge variant={item.status === 'completed' ? 'success' : item.status === 'in-progress' ? 'warning' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Side Panel Area */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your team.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[
                { user: "Alice W.", action: "requested leave", time: "10 mins ago", type: "leave" },
                { user: "Bob S.", action: "submitted expense report", time: "2 hours ago", type: "finance" },
                { user: "System", action: "Payroll run completed", time: "5 hours ago", type: "system" },
                { user: "Charlie D.", action: "updated profile", time: "Yesterday", type: "profile" }
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-4 relaltive">
                  <div className="relative z-10 grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary ring-2 ring-background">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      <span className="font-semibold">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
