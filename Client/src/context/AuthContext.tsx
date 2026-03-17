"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authManager } from "@/lib/auth-manager";
import { api, refreshAccessToken } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { toastManager } from "@/lib/toast-manager";
import { UserService } from "@/services/user.service";

// ── Profile cache (sessionStorage, tab-scoped, 5-min TTL) ────────────────────
// Avoids a redundant /auth/profile call on every hard-refresh by reusing
// the recently-fetched profile. The cache is cleared on logout and on cache
// expiry; tokens are never stored here.
const PROFILE_CACHE_KEY = "auth_profile_v1";
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedUser(): User | null {
  try {
    const raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const { user, ts } = JSON.parse(raw) as { user: User; ts: number };
    if (Date.now() - ts > PROFILE_CACHE_TTL) return null;
    return user;
  } catch {
    return null;
  }
}

function setCachedUser(user: User): void {
  try {
    sessionStorage.setItem(
      PROFILE_CACHE_KEY,
      JSON.stringify({ user, ts: Date.now() })
    );
  } catch {
    // sessionStorage quota exceeded or unavailable — non-critical
  }
}

function clearCachedUser(): void {
  try {
    sessionStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    // non-critical
  }
}

interface PanDetails {
  panNumber: string | null;
  panName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  isPanVerified?: boolean;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: "USER" | "ADMIN";
  profilePicture?: string | null;
  panDetails?: PanDetails | null;
}


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoaded: boolean;
  login: (data: { tokens: any; user: User }) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  /* ------------------------------------------------------------------
     LOAD USER FROM LOCALSTORAGE ON APP START (SSR SAFE)
  ------------------------------------------------------------------ */
useEffect(() => {
  if (typeof window === "undefined") return;

  const bootstrapAuth = async () => {
    // The auth_role cookie is a non-HttpOnly session hint set on login/refresh
    // and cleared on logout. If it's absent the user has no active session, so
    // we can skip the refresh attempt entirely and avoid an unnecessary API call.
    const hasSessionHint =
      typeof document !== "undefined" &&
      document.cookie.split(";").some((c) => c.trim().startsWith("auth_role="));

    if (!hasSessionHint) {
      setIsLoaded(true);
      return;
    }

    // On hard refresh the in-memory access token is wiped. Exchange via the
    // HttpOnly refresh_token cookie (sent automatically by the browser).
    if (!authManager.getAccessToken()) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        // Refresh token invalid/expired — clear session hint and bail out
        authManager.logout();
        setIsLoaded(true);
        return;
      }
    }

    try {
      // Serve from sessionStorage cache if it's still fresh — avoids an extra
      // /auth/profile round-trip on every hard-refresh within the TTL window.
      const cached = getCachedUser();
      if (cached) {
        setUser(cached);
      } else {
        await refreshUser();
      }
      setIsAuthenticated(true);
    } catch {
      // Token invalid or network error — clear tokens and show unauthenticated
      authManager.logout();
      clearCachedUser();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  };

  bootstrapAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  /* ------------------------------------------------------------------
     LOGIN — saves tokens, hydrates user from the server response
  ------------------------------------------------------------------ */
  const login = ({ tokens, user }: { tokens: any; user: User }) => {
    if (!tokens?.access_token) {
      toastManager.show("Invalid login response", "error");
      return;
    }

    authManager.setAuth(tokens);
    authManager.setRoleCookie(user.role);
    setCachedUser(user);

    setUser(user);
    setIsAuthenticated(true);

    toastManager.show("Login successful!", "success");
    router.replace("/dashboard");
  };

  /* ------------------------------------------------------------------
     LOGOUT — clears tokens, state, then redirects
  ------------------------------------------------------------------ */
  const logout = async () => {
    try {
      await api.post("/auth/logout").catch(() => {
        // Best-effort — don't block local logout if server is unreachable
      });
    } finally {
      authManager.logout();
      clearCachedUser();
      setIsAuthenticated(false);
      setUser(null);
      router.replace("/");
    }
  };


  /* ------------------------------------------------------------------
     HANDLE GLOBAL LOGOUT EVENT (from axios refresh failure)
  ------------------------------------------------------------------ */
  useEffect(() => {
    const handler = () => {
      setIsAuthenticated(false);
      setUser(null);
      router.replace("/");
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[AuthContext] Unhandled promise rejection:", event.reason);
      }
    };

    window.addEventListener("auth-logout", handler);
    window.addEventListener("unhandledrejection", rejectionHandler);
    return () => {
      window.removeEventListener("auth-logout", handler);
      window.removeEventListener("unhandledrejection", rejectionHandler);
    };
  }, []);

  /* -------------------------
     REFRESH USER DETAILS
  -------------------------- */

  const refreshUser = async () => {
    const res = await UserService.getProfile();
    const data = res.data;

    const normalizedUser: User = {
      ...data,
      profilePicture: data.profileImageUrl ?? null,
    };

    authManager.setRoleCookie(normalizedUser.role);
    setCachedUser(normalizedUser);
    setUser(normalizedUser);
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoaded,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
