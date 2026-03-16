"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/admin/AdminNavbar";
import { useAuth } from "@/context/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user || user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [isLoaded, user, router]);

  // Still bootstrapping auth — show skeleton to avoid layout shift
  if (!isLoaded) {
    return (
      <>
        <AdminNavbar />
        <main className="container-fluid p-3">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "60vh",
              color: "#6c757d",
            }}
          >
            Loading…
          </div>
        </main>
      </>
    );
  }

  // Role check complete — non-admin: redirect is in flight, render nothing
  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminNavbar />
      <main className="container-fluid p-3">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </>
  );
}
