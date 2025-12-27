"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../../lib/auth/context";
import { ApiError } from "../../../lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await login({ email, password, mfaToken: mfaToken || undefined });
      setMessage("Signed in successfully.");
      // Redirect to home page after successful login
      setTimeout(() => router.push("/"), 500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Login failed");
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 bg-white px-6 py-10 text-zinc-900">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Auth</p>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-zinc-600">Enter your credentials to continue. Add MFA code if your account requires it.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-800" htmlFor="password">
            Password
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-800" htmlFor="mfa">
            MFA code (optional)
          </label>
          <input
            id="mfa"
            type="text"
            inputMode="numeric"
            value={mfaToken}
            onChange={(e) => setMfaToken(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            placeholder="123456"
          />
          <p className="text-xs text-zinc-500">Provide if your account enforces TOTP.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-600">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="flex items-center justify-between text-sm text-zinc-600">
          <Link href="/" className="underline hover:text-zinc-800">
            Back to home
          </Link>
          <Link href="/reset-password" className="underline hover:text-zinc-800">
            Forgot password?
          </Link>
        </div>
      </form>
    </main>
  );
}
