"use client";

import "./globals.css";
import { AppProviders } from "./providers";
import { ToastProvider } from "@/components/toast/ToastContext";
import { GlobalLoader } from "@/components/loading/GlobalLoader";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/UserNavbar/Navbar";
import { usePathname } from "next/navigation";
//import "bootstrap/dist/css/bootstrap.min.css";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Routes where navbar should NOT appear
  const hideNavbarRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/admin",
  ];

  const shouldHideNavbar = hideNavbarRoutes.includes(pathname);

  return (
    <>
      <GlobalLoader />

      {!shouldHideNavbar && <Navbar />}

      <main
        style={{
          paddingTop: shouldHideNavbar ? "0px" : "70px", // navbar height + little buffer
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
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
