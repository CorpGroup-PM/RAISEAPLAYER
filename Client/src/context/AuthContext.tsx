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
    const hasToken = authManager.isAuthenticated();

    if (!hasToken) {
      setIsLoaded(true);
      return;
    }

    try {
      // 🔥 ALWAYS fetch user from backend on app load
      await refreshUser();
      setIsAuthenticated(true);
    } catch (err) {
      logout();
    } finally {
      setIsLoaded(true);
    }
  };

  bootstrapAuth();
}, []);


  /* ------------------------------------------------------------------
     LOGIN — uses authManager.setAuth(tokens, user)
  ------------------------------------------------------------------ */
  const login = ({ tokens, user }: { tokens: any; user: User }) => {
    if (!tokens?.access_token) {
      toastManager.show("Invalid login response", "error");
      return;
    }

    // 🔥 Save tokens + user to localStorage
    authManager.setAuth(tokens, user);

    setUser(user);
    setIsAuthenticated(true);

    toastManager.show("Login successful!", "success");
    router.replace("/dashboard");
  };

  /* ------------------------------------------------------------------
     LOGOUT — triggers global cleanup + redirects
  ------------------------------------------------------------------ */
  const logout = async () => {
  try {
    // ✅ if authManager.logout() does API call, wait for it
    await authManager.logout();
  } catch (e) {
    console.error("logout failed:", e);
  } finally {
    setIsAuthenticated(false);
    setUser(null);

    // ✅ clear EVERYTHING related to auth (important)
    localStorage.removeItem("user");
    localStorage.removeItem("tokens");        // ✅ add (common)
    localStorage.removeItem("access_token");  // ✅ add (common)
    localStorage.removeItem("refresh_token"); // ✅ add (common)

    // ✅ immediate navigation
    router.replace("/");

    // ✅ hard fallback if something else keeps bouncing you back
    setTimeout(() => {
      window.location.href = "/";
    }, 50);
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
   try {
     const res = await UserService.getProfile();
     const data = res.data;

     // 🔥 NORMALIZE BACKEND RESPONSE
     const normalizedUser = {
       ...data,
       profilePicture: data.profileImageUrl ?? null,
     };

     setUser(normalizedUser);
     localStorage.setItem("user", JSON.stringify(normalizedUser));
   } catch (err) {
     console.error("Failed to refresh user:", err);
     logout();
   }
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
