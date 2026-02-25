"use client";

import "./globals.css";
import { AppProviders } from "./providers";
import { ToastProvider } from "@/components/toast/ToastContext";
import { GlobalLoader } from "@/components/loading/GlobalLoader";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/UserNavbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { usePathname } from "next/navigation";
//import "bootstrap/dist/css/bootstrap.min.css";

// Routes where Navbar AND Footer should NOT appear
const HIDE_CHROME_ROUTES = ["/login", "/register", "/forgot-password"];

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith("/admin");
  const shouldHideNavbar =
    HIDE_CHROME_ROUTES.includes(pathname) || isAdminRoute;
  const shouldHideFooter =
    HIDE_CHROME_ROUTES.includes(pathname) || isAdminRoute;

  return (
    <>
      <GlobalLoader />

      {!shouldHideNavbar && <Navbar />}

      <main
        style={{
          paddingTop: shouldHideNavbar ? "0px" : "70px",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>

      {!shouldHideFooter && <Footer />}
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <ToastProvider>
            <AuthProvider>
              <LayoutContent>{children}</LayoutContent>
            </AuthProvider>
          </ToastProvider>
        </AppProviders>
        {/* <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          async
        ></script> */}
      </body>
    </html>
  );
}
