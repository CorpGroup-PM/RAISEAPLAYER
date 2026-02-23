"use client";

import { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import AdminNavbar from "@/components/admin/AdminNavbar"; // ✅ adjust path if needed

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
 
  return (
    <>
      <AdminNavbar /> {/* ✅ existing navbar */}
      <main className="container-fluid p-3">{children}</main>
    </>
  );
}
