"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../../lib/auth/context";

/**
 * Wrapper component for pages that require authentication
 * Redirects to login if user is not authenticated
 */
export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { state } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (state.status === "unauthenticated") {
      router.push("/login");
    }
  }, [state.status, router]);

  // Show nothing while checking auth status or redirecting
  if (state.status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-zinc-600">Checking authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
}
