"use client";

import Link from "next/link";
import { Protected } from "../components/auth/Protected";
import { useAuth } from "../lib/auth/context";
import { env } from "../lib/env";
import { AppShell } from "../components/layout/AppShell";

export default function Home() {
  const { state, logout } = useAuth();

  return (
    <AppShell>
      <div className="space-y-4">
        <section className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">{env.appName}</p>
          <h1 className="text-2xl font-semibold">Frontend foundation ready</h1>
          <p className="text-sm text-zinc-600">
            Core infrastructure and auth plumbing are wired. Hook up real API endpoints and UI next.
          </p>
        </section>

        <section className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-800">Auth state</p>
            {state.status === "authenticated" ? (
              <button
                onClick={logout}
                className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100"
              >
                Login
              </Link>
            )}
          </div>
          <p className="text-sm text-zinc-600">Status: {state.status}</p>
          {state.user ? (
            <p className="text-sm text-zinc-600">Signed in as {state.user.email}</p>
          ) : (
            <p className="text-sm text-zinc-600">No user session detected</p>
          )}
          {state.roles.length > 0 && (
            <p className="text-sm text-zinc-600">Roles: {state.roles.join(", ")}</p>
          )}
        </section>

        <section className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-800">Protected example</p>
          <Protected roles={["hr_admin"]} fallback={<p className="text-sm text-zinc-600">HR-only content hidden.</p>}>
            <p className="text-sm text-emerald-700">HR-only content visible.</p>
          </Protected>
        </section>
      </div>
    </AppShell>
  );
}
