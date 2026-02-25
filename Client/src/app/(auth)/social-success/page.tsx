"use client";

import { useEffect } from "react";
import { authManager } from "@/lib/auth-manager";
import "./social-success.css";

export default function SocialSuccess() {
  useEffect(() => {
    // Read from URL fragment (#) — never logged by servers or proxies
    const fragment = window.location.hash.slice(1); // strip leading '#'
    const params = new URLSearchParams(fragment);

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      authManager.setTokens(accessToken, refreshToken);

      // Clear fragment from URL before redirecting so tokens don't sit in history
      window.history.replaceState(null, "", window.location.pathname);

      window.location.href = "/";
    } else if (!authManager.getRefreshToken()) {
      // Only redirect to login if tokens were never stored.
      // In React StrictMode, useEffect runs twice — the first run stores tokens
      // and clears the hash; the second run sees an empty hash. We must not
      // redirect to /login in that second run, so we check localStorage first.
      window.location.href = "/login";
    }
    // else: tokens were stored by the first run; navigation to "/" is already
    // underway — do nothing.
  }, []);

  return (
    <div className="success-wrapper">
      <div className="success-card">
        <div className="loader"></div>
        <h2 className="success-title">Signing you in…</h2>
        <p className="success-sub">
          Please wait while we verify your Google login.
        </p>
      </div>
    </div>
  );
}
