"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authManager } from "@/lib/auth-manager";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { toastManager } from "@/lib/toast-manager";
import { UserService } from "@/services/user.service";

interface PanDetails {
  panNumber: string | null;
  panName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
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
    if (!authManager.isAuthenticated()) {
      setIsLoaded(true);
      return;
    }

    try {
      await refreshUser();
      setIsAuthenticated(true);
    } catch {
      // Token invalid or network error — clear tokens and show unauthenticated
      authManager.logout();
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

    window.addEventListener("auth-logout", handler);
    return () => window.removeEventListener("auth-logout", handler);
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

    setUser(normalizedUser);
    // User data is NOT persisted to localStorage — always fetched fresh from API
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
      {/* Prevent UI Flicker */}
      {isLoaded ? children : <div></div>}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
