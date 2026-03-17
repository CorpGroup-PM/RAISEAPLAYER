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

const ROLE_COOKIE_KEY = "auth_role";

let _accessToken: string | null = null;

/** Write a client-readable cookie so Next.js Edge middleware can route-guard
 *  protected paths without requiring the JWT (which lives in memory only).
 *  This cookie is NOT HttpOnly — middleware reads it on the Edge.
 *  It is NOT the auth source-of-truth; every protected API call is still
 *  validated by the backend JWT guard. */
function setRoleCookie(role: string) {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ROLE_COOKIE_KEY}=${role}; path=/; SameSite=Strict${secure}`;
}

function clearRoleCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${ROLE_COOKIE_KEY}=; path=/; max-age=0`;
}

export const authManager = {
  // ── Write ───────────────────────────────────────────────────────────────────
  // Only the access token is stored client-side. The refresh token lives in
  // an HttpOnly cookie set by the backend — it cannot be read from JavaScript.
  setTokens(access: string) {
    _accessToken = access; // memory only
  },

  setAuth(tokens: { access_token: string; refresh_token?: string }) {
    if (typeof window === "undefined") return;
    this.setTokens(tokens.access_token);
    // refresh_token is now managed via HttpOnly cookie set by the backend
  },

  // ── Read ────────────────────────────────────────────────────────────────────
  getAccessToken(): string | null {
    return _accessToken;
  },

  // ── Role cookie (readable by Next.js Edge middleware) ────────────────────────
  setRoleCookie,
  clearRoleCookie,

  // ── Destroy ─────────────────────────────────────────────────────────────────
  logout() {
    _accessToken = null;
    clearRoleCookie();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-logout"));
    }
  },

  // ── Utils ───────────────────────────────────────────────────────────────────
  /** True when there is an in-memory access token OR a session hint cookie
   *  (the auth_role cookie persists between hard refreshes). */
  isAuthenticated(): boolean {
    if (!!_accessToken) return true;
    if (typeof document === "undefined") return false;
    return document.cookie.split(";").some(
      (c) => c.trim().startsWith(`${ROLE_COOKIE_KEY}=`)
    );
  },
};
