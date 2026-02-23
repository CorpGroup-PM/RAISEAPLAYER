"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function useAuthGuard() {
  const router = useRouter();
  const { isAuthenticated, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoaded, isAuthenticated]);
}
