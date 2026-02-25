"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/UserNavbar/Navbar";
import Footer from "@/components/Footer/Footer";

const HIDE_CHROME_ROUTES = ["/login", "/register", "/forgot-password"];

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith("/admin");
  const hideChrome = HIDE_CHROME_ROUTES.includes(pathname) || isAdminRoute;

  return (
    <>
      {!hideChrome && <Navbar />}
      <main
        style={{
          paddingTop: hideChrome ? "0px" : "70px",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
      {!hideChrome && <Footer />}
    </>
  );
}
