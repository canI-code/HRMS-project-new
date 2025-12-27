"use client";

import Link from "next/link";
import { useState } from "react";
import { request } from "../../../lib/api-client";
import { ApiError } from "../../../lib/api-client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<"request" | "reset">("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await request("/auth/password/forgot", {
        method: "POST",
        body: { email },
        skipAuth: true,
      });
      setMessage("Reset code sent. Check your email.");
      setStage("reset");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Request failed");
      } else {
        setError("Request failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await request("/auth/password/reset", {
        method: "POST",
        body: { email, token, password },
        skipAuth: true,
      });
      setMessage("Password updated. You can sign in now.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Reset failed");
      } else {
        setError("Reset failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 bg-white px-6 py-10 text-zinc-900">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Auth</p>
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="text-sm text-zinc-600">Request a reset code, then set a new password.</p>
      </header>

      {stage === "request" ? (
        <form onSubmit={handleRequest} className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              placeholder="you@example.com"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-600">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Sending…" : "Send reset code"}
          </button>

          <div className="flex items-center justify-between text-sm text-zinc-600">
            <Link href="/login" className="underline hover:text-zinc-800">
              Back to login
            </Link>
            <Link href="/" className="underline hover:text-zinc-800">
              Home
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800" htmlFor="email-confirm">
              Email
            </label>
            <input
              id="email-confirm"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800" htmlFor="token">
              Reset code
            </label>
            <input
              id="token"
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              placeholder="Code from email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-600">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Updating…" : "Update password"}
          </button>

          <div className="flex items-center justify-between text-sm text-zinc-600">
            <Link href="/login" className="underline hover:text-zinc-800">
              Back to login
            </Link>
            <Link href="/" className="underline hover:text-zinc-800">
              Home
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}
