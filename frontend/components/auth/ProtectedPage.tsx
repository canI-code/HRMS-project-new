"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
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
    } else if (state.status === "authenticated" && state.user?.mustChangePassword) {
      router.push("/change-password");
    }
  }, [state.status, router, state.user]);

  // Show nothing while checking auth status or redirecting
  if (state.status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-zinc-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
