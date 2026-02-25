"use client";

/**
 * auth-manager — token storage strategy
 *
 * ACCESS  token → memory only (never persisted).
 *   Short-lived (~15 min). Survives page JS but not hard refresh — that's
 *   intentional: a hard refresh triggers bootstrapAuth() which calls the
 *   /profile API to re-hydrate, issuing a new access token via the refresh
 *   token stored in localStorage.
 *
 * REFRESH token → localStorage only.
 *   Longer-lived. Required to re-issue access tokens after hard refresh /
 *   tab reopen without forcing a full login.
 *
 * USER object → NOT persisted.
 *   Always fetched fresh from the API on bootstrap (AuthContext.refreshUser).
 *   This prevents stale PAN / role data being read from storage.
 */

const REFRESH_TOKEN_KEY = "refresh_token";

let _accessToken: string | null = null;

export const authManager = {
  // ── Write ───────────────────────────────────────────────────────────────────
  setTokens(access: string, refresh?: string) {
    _accessToken = access; // memory only

    if (refresh) {
      try {
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
      } catch {
        // Silently fail in environments where localStorage is unavailable
      }
    }
  },

  setAuth(tokens: { access_token: string; refresh_token: string }) {
    if (typeof window === "undefined") return;
    this.setTokens(tokens.access_token, tokens.refresh_token);
  },

  // ── Read ────────────────────────────────────────────────────────────────────
  getAccessToken(): string | null {
    return _accessToken;
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  // ── Destroy ─────────────────────────────────────────────────────────────────
  logout() {
    _accessToken = null;
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-logout"));
    }
  },

  // ── Utils ───────────────────────────────────────────────────────────────────
  isAuthenticated(): boolean {
    // Has an in-memory token OR has a refresh token (can silently refresh)
    return !!_accessToken || !!this.getRefreshToken();
  },
};
