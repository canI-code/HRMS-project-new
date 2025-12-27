"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "../../lib/auth/context";
import type { UserRole } from "../../lib/auth/types";

interface NavItem {
  label: string;
  href: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Employees", href: "/employees", roles: ["super_admin", "hr_admin", "manager"] },
  { label: "Attendance", href: "/attendance", roles: ["super_admin", "hr_admin", "manager", "employee"] },
  { label: "Leave", href: "/leave", roles: ["super_admin", "hr_admin", "manager", "employee"] },
  { label: "Payroll", href: "/payroll", roles: ["super_admin", "hr_admin", "manager"] },
  { label: "Performance", href: "/performance", roles: ["super_admin", "hr_admin", "manager"] },
  { label: "Documents", href: "/documents", roles: ["super_admin", "hr_admin", "manager", "employee"] },
  { label: "Notifications", href: "/notifications", roles: ["super_admin", "hr_admin", "manager", "employee"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, hasRole, logout } = useAuth();

  const filteredNav = useMemo(() => navItems.filter((item) => hasRole(item.roles)), [hasRole]);

  return (
    <div className="flex min-h-screen bg-white text-zinc-900">
      <aside className="hidden w-56 flex-none border-r border-zinc-200 bg-zinc-50 px-4 py-6 md:block">
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Navigation</p>
        </div>
        <nav className="space-y-1 text-sm font-medium text-zinc-700">
          {filteredNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 transition hover:bg-zinc-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Own HRMS</p>
            <p className="text-sm font-semibold text-zinc-900">People Ops Console</p>
          </div>
          <div className="flex items-center gap-3">
            {state.user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-900">{state.user.email}</p>
                  {state.roles.length > 0 && (
                    <p className="text-xs text-zinc-500">{state.roles.join(", ")}</p>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100"
              >
                Login
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
