"use client";

import { useEffect, useRef } from "react";
import { authManager } from "@/lib/auth-manager";
import { api } from "@/lib/api-client";
import "./social-success.css";

export default function SocialSuccess() {
  const exchanged = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-invocation
    if (exchanged.current) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      // No code in URL — if already authenticated (e.g. direct revisit), go home
      if (authManager.isAuthenticated()) {
        window.location.href = "/";
      } else {
        window.location.href = "/login";
      }
      return;
    }

    exchanged.current = true;

    // Clear the code from the URL immediately so it never lingers in history
    window.history.replaceState(null, "", window.location.pathname);

    // Exchange the one-time code for tokens via a secure POST body
    api
      .post("/auth/social/exchange", { code })
      .then((res) => {
        const { tokens, user } = res.data;
        if (tokens?.access_token) {
          authManager.setTokens(tokens.access_token);
          authManager.setRoleCookie(user?.role || "USER");
          window.location.href = "/";
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => {
        window.location.href = "/login";
      });
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
