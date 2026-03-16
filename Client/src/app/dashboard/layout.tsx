"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";

/**
 * Shared layout guard for all /dashboard/* routes.
 *
 * Renders a loading state while auth bootstraps, then redirects to /login
 * if the user is not authenticated. This ensures every page under /dashboard
 * is automatically protected — no individual page needs its own guard.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoaded, isAuthenticated, router]);

  // Still bootstrapping — show a neutral loading state
  if (!isLoaded) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          color: "#6c757d",
        }}
      >
        Loading…
      </div>
    );
  }

  // Redirect in flight — render nothing to prevent content flash
  if (!isAuthenticated) {
    return null;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
