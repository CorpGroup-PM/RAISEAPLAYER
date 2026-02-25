"use client";

import AdminNavbar from "@/components/admin/AdminNavbar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // if (!isAuthenticated) router.push("/login");
    // else if (user?.role !== "admin") router.push("/dashboard");
  }, [isAuthenticated, user, router]);

  return (
    <>
      <AdminNavbar />
      <div style={{ padding: "2rem", paddingTop: "70px" }}>
        <h2>Admin Dashboard</h2>
        Welcome, {user?.firstName} {user?.lastName}
      </div>
    </>
  );
}
