"use client";

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toastManager } from "@/lib/toast-manager";
import { loadingManager } from "@/lib/loading-manager";
import { authManager } from "@/lib/auth-manager";

/* ----------------------------------------------
   ENV VALIDATION
---------------------------------------------- */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    "[api-client] NEXT_PUBLIC_API_URL is not set. " +
    "Add it to your .env.local file."
  );
}

/* ----------------------------------------------
   AXIOS INSTANCE
---------------------------------------------- */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30_000, // 30 s — prevents requests hanging indefinitely
});

/* ----------------------------------------------
   REFRESH TOKEN QUEUE HANDLING
---------------------------------------------- */
let isRefreshing = false;

type QueueItem = {
  resolve: (token: string | null) => void;
  reject: (err: any) => void;
};

let requestQueue: QueueItem[] = [];

const processQueue = (error: any, token: string | null = null) => {
  requestQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  requestQueue = [];
};

/* ----------------------------------------------
   REFRESH ACCESS TOKEN (✔ FIXED)
   🔑 Sends refresh token in Authorization header
---------------------------------------------- */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = authManager.getRefreshToken();
    if (!refreshToken) return null;

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      null,
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`, // ✅ REQUIRED
        },
        withCredentials: true,
      }
    );

    const { access_token, refresh_token } = response.data || {};

    if (access_token && refresh_token) {
      authManager.setTokens(access_token, refresh_token);
      return access_token;
    }

    return null;
  } catch (err) {
    // Network failure or 401 — refresh token is invalid/expired
    const status = (err as AxiosError)?.response?.status;
    if (status !== 401) {
      // Log unexpected errors (not normal token-expired 401s)
      console.warn("[api-client] Token refresh failed:", (err as Error).message);
    }
    return null;
  }
}

/* ----------------------------------------------
   REQUEST INTERCEPTOR
---------------------------------------------- */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    loadingManager.start();

    const accessToken = authManager.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    loadingManager.stop();
    return Promise.reject(error);
  }
);

/* ----------------------------------------------
   RESPONSE INTERCEPTOR (✔ FINAL VERSION)
---------------------------------------------- */
api.interceptors.response.use(
  (response) => {
    loadingManager.stop();

    const method = response.config.method?.toUpperCase();
    if (["POST", "PUT", "DELETE"].includes(method || "")) {
      toastManager.show(
        response.data?.message || `${method} successful`,
        "success"
      );
    }

    return response;
  },

  async (error: AxiosError<any>) => {
    loadingManager.stop();

    const originalRequest: any = error.config;
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || "Something went wrong";

    /* ----------------------------------------------
       AUTH ROUTE IDENTIFICATION
    ---------------------------------------------- */
    const isPublicAuthRoute =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/forgot-password") ||
      originalRequest?.url?.includes("/auth/verify-email");

    const isRefreshRoute = originalRequest?.url?.includes("/auth/refresh");

    /* ----------------------------------------------
       CASE 1: PUBLIC AUTH FAILURES
       ❌ DO NOT REFRESH
    ---------------------------------------------- */
    if ((status === 400 || status === 401) && isPublicAuthRoute) {
      toastManager.show(message, "error");
      return Promise.reject(error);
    }

    /* ----------------------------------------------
       CASE 2: ACCESS TOKEN EXPIRED → REFRESH
    ---------------------------------------------- */
    if (
      status === 401 &&
      !originalRequest._retry &&
      !isPublicAuthRoute &&
      !isRefreshRoute
    ) {
      originalRequest._retry = true;

      // ⏳ If refresh already running → queue request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          requestQueue.push({ resolve, reject });
        }).then((newToken) => {
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      const newAccessToken = await refreshAccessToken();

      if (!newAccessToken) {
        processQueue(null, null);
        isRefreshing = false;

        // 🚪 Force logout
        authManager.logout();
        toastManager.show("Session expired. Please login again.", "error");

        return Promise.reject(error);
      }

      // ✅ Refresh success
      processQueue(null, newAccessToken);
      isRefreshing = false;

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    }

    /* ----------------------------------------------
       CASE 3: OTHER ERRORS
    ---------------------------------------------- */
    toastManager.show(message, status && status >= 500 ? "error" : "info");

    return Promise.reject(error);
  }
);