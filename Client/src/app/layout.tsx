import "./globals.css";
import type { Metadata,Viewport } from "next";
import { AppProviders } from "./providers";
import { ToastProvider } from "@/components/toast/ToastContext";
import { GlobalLoader } from "@/components/loading/GlobalLoader";
import { AuthProvider } from "@/context/AuthContext";
import LayoutShell from "@/components/LayoutShell/LayoutShell";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";

export const metadata: Metadata = {
  title: {
    default: "Raise A Player — Fundraising Platform for Athletes",
    template: "%s — Raise A Player",
  },
  description:
    "Raise A Player helps young athletes across India raise funds for training, equipment, tournaments, and more. Every rupee counts toward a champion's journey.",
  keywords: [
    "athlete fundraising",
    "sports crowdfunding India",
    "raise a player",
    "fundraiser for athletes",
    "sports donation",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://raiseaplayer.org"
  ),
  openGraph: {
    type: "website",
    siteName: "Raise A Player",
    title: "Raise A Player — Fundraising Platform for Athletes",
    description:
      "Empowering young athletes across India through community-backed fundraising.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Raise A Player",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Raise A Player",
    description:
      "Empowering young athletes across India through community-backed fundraising.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

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
              <GlobalLoader />
              <ErrorBoundary>
                <LayoutShell>{children}</LayoutShell>
              </ErrorBoundary>
            </AuthProvider>
          </ToastProvider>
        </AppProviders>
      </body>
    </html>
  );
}
