"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Guards the current page behind authentication (and optionally a role).
 *
 * @param requiredRole - If provided, users without that role are redirected
 *                       to /dashboard instead of /login.
 *
 * @returns `isReady` — true once auth has bootstrapped AND the user passes
 *          the guard. Callers should render a skeleton / null while !isReady
 *          to prevent a flash of protected content.
 *
 * @example
 *   const { isReady } = useAuthGuard();
 *   if (!isReady) return <PageSkeleton />;
 */
export function useAuthGuard(requiredRole?: "USER" | "ADMIN") {
  const router = useRouter();
  const { user, isAuthenticated, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isAuthenticated, user, requiredRole, router]);

  const isAuthorised =
    isLoaded &&
    isAuthenticated &&
    (requiredRole == null || user?.role === requiredRole);

  return { isReady: isAuthorised };
}
