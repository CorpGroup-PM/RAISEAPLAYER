"use client";

import { useEffect } from "react";
import { authManager } from "@/lib/auth-manager";
import "./social-success.css";

export default function SocialSuccess() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const params = url.searchParams; // Helper to access params

    // 1. Extract Tokens
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    // 2. Extract User Data (sent from backend)
    const user = {
      email: params.get("email"),
      firstName: params.get("first_name"),
      lastName: params.get("last_name"),
      profileImageUrl: params.get("picture"),
    };

    if (accessToken && refreshToken) {
      const tokens = {
        access_token: accessToken,
        refresh_token: refreshToken,
      };

      // 3. Save to your Auth State / Local Storage
      // You likely need to update your authManager to accept the user object too
      console.log(user);
      
      authManager.setAuth(tokens, user);

      window.location.href = "/";
    } else {
      window.location.href = "/login";
    }
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
