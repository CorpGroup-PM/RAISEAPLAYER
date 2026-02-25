"use client";

const ACCESS_TOKEN = "access_token";
const REFRESH_TOKEN = "refresh_token";
const AUTH_USER = "user"

let accessTokenMemory: string | null = null;
let refreshTokenMemory: string | null = null;

export const authManager = {
  /* Save tokens */
  setTokens(access: string, refresh?: string) {
    accessTokenMemory = access;
    localStorage.setItem(ACCESS_TOKEN, access);

    if (refresh) {
      refreshTokenMemory = refresh;
      localStorage.setItem(REFRESH_TOKEN, refresh);
    }
  },

  /* Login helper */
  setAuth(tokens: any, user: any) {
    if (typeof window === "undefined") return;

    localStorage.setItem(ACCESS_TOKEN, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN, tokens.refresh_token);
    localStorage.setItem(AUTH_USER, JSON.stringify(user));
  },

  /* Get tokens */
  getAccessToken() {
    if (accessTokenMemory) return accessTokenMemory;
    const stored = localStorage.getItem(ACCESS_TOKEN);
    if (stored) accessTokenMemory = stored;
    return stored;
  },

  getRefreshToken() {
    if (refreshTokenMemory) return refreshTokenMemory;
    const stored = localStorage.getItem(REFRESH_TOKEN);
    if (stored) refreshTokenMemory = stored;
    return stored;
  },

  /* Logout — triggers global event */
  logout() {
    accessTokenMemory = null;
    refreshTokenMemory = null;

    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem(AUTH_USER);

    window.dispatchEvent(new Event("auth-logout"));
    window.location.href = "/login";
  },

  /* Auth check */
  isAuthenticated() {
    return !!this.getAccessToken();
  },
};
