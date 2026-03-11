"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import AdminNavbar from "@/components/admin/AdminNavbar";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded } = useAuth();

  return (
    <>
      <AdminNavbar />
      <main className="container-fluid p-3">
        {isLoaded ? children : null}
      </main>
    </>
  );
}
