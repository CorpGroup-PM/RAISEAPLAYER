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
   REFRESH ACCESS TOKEN
   🍪 The refresh token lives in an HttpOnly cookie set by the backend.
      withCredentials:true causes the browser to send it automatically —
      no manual Authorization header needed.
---------------------------------------------- */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      null,
      { withCredentials: true }
    );

    const { access_token } = response.data || {};

    if (access_token) {
      authManager.setTokens(access_token);
      return access_token;
    }

    return null;
  } catch (err) {
    // Network failure or 401 — refresh token is invalid/expired.
    // Only log in development to avoid leaking token lifecycle info.
    if (process.env.NODE_ENV === "development") {
      const status = (err as AxiosError)?.response?.status;
      if (status !== 401) {
        console.warn("[api-client] Token refresh failed:", (err as Error).message);
      }
    }
    return null;
  }
}

/* ----------------------------------------------
   ERROR MESSAGE CLASSIFIER
   Maps backend/network errors to safe, user-friendly strings.
   Backend implementation details (stack traces, DB constraint names,
   service class names) are never surfaced to the UI.
---------------------------------------------- */
function toUserMessage(error: AxiosError<any>): string {
  const status = error.response?.status;
  const rawMsg: unknown = error.response?.data?.message;

  // NestJS ValidationPipe returns message as string[] — normalise to string
  const serverMsg: unknown = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;

  // Short, plain-text server messages on auth/validation routes are safe to show
  const isShortSafeMsg =
    typeof serverMsg === "string" &&
    serverMsg.length <= 120 &&
    !/\bat\s+\w+[\\/]/.test(serverMsg); // reject stack-trace-like strings

  if (!status) {
    return "Unable to reach the server. Please check your connection.";
  }

  switch (status) {
    case 400:
      return isShortSafeMsg ? serverMsg as string : "Invalid request. Please check your input and try again.";
    case 401:
      return isShortSafeMsg ? serverMsg as string : "Your session has expired. Please log in again.";
    case 403:
      return isShortSafeMsg ? serverMsg as string : "You do not have permission to perform this action.";
    case 404:
      return isShortSafeMsg ? serverMsg as string : "The requested resource was not found.";
    case 409:
      return isShortSafeMsg ? serverMsg as string : "A conflict occurred. The resource may already exist.";
    case 422:
      return "The submitted data could not be processed. Please review your input.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
    case 502:
    case 503:
      return "Something went wrong on our end. Please try again later.";
    default:
      return isShortSafeMsg ? serverMsg as string : "An unexpected error occurred. Please try again.";
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
    const url = response.config.url || "";
    const silentRoutes = ["/auth/login", "/auth/refresh", "/auth/logout", "/auth/social/exchange"];
    const isSilent = silentRoutes.some((r) => url.includes(r));

    if (["POST", "PUT", "DELETE"].includes(method || "") && !isSilent) {
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
    const message = toUserMessage(error);

    /* ----------------------------------------------
       AUTH ROUTE IDENTIFICATION
    ---------------------------------------------- */
    const isPublicAuthRoute =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/forgot-password") ||
      originalRequest?.url?.includes("/auth/verify-email") ||
      originalRequest?.url?.includes("/auth/social/exchange");

    const isRefreshRoute = originalRequest?.url?.includes("/auth/refresh");
    const isLogoutRoute  = originalRequest?.url?.includes("/auth/logout");

    /* ----------------------------------------------
       LOGOUT: always silently reject — local logout
       handles cleanup, no toast needed
    ---------------------------------------------- */
    if (isLogoutRoute) {
      return Promise.reject(error);
    }

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