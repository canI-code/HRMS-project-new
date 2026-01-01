"use client";

import { useAuth } from "@/lib/auth/context";
import AdminDashboard from "./AdminDashboard";
import EmployeeDashboard from "./EmployeeDashboard";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

export default function HRDashboard() {
  const { state, hasRole } = useAuth();
  const isAdmin = hasRole(["super_admin", "hr_admin"]);

  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const formattedTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top blue bar */}
      <div className="flex items-center justify-between bg-blue-700 px-6 py-3 text-white">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
            {state.user?.name?.[0] || 'U'}
          </div>
          <span className="text-sm font-semibold">{isAdmin ? "HR Dashboard" : "Employee Dashboard"}</span>
          <span className="ml-2 text-xs text-blue-100 hidden sm:inline">
            {isAdmin ? "Overview of organization metrics." : "Your personal workspace."}
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs hidden sm:block">
            <span className="font-semibold">Date:</span> {formattedDate}
            <span className="mx-2">|</span>
            <span className="font-semibold">Time:</span> {formattedTime}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-6">

        {isAdmin ? <AdminDashboard /> : <EmployeeDashboard />}
      </div>
    </div>
  );
}
