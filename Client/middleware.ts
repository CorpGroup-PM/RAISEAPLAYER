import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth uses JWT Bearer tokens stored in memory / localStorage.
// The JWT itself cannot be read by Edge middleware, so a lightweight
// `auth_role` cookie (set client-side by auth-manager.ts on login/refresh,
// cleared on logout) is used as a routing hint.
//
// IMPORTANT: this cookie is NOT the auth source-of-truth. All backend API
// calls are still protected by the real JWT guard. This middleware provides
// a first-pass server-side redirect so protected HTML is never sent to
// unauthenticated or unauthorised clients.
//
// If auth is later migrated to HttpOnly cookies (see B-2-1), this middleware
// can be upgraded to full JWT verification using the `jose` library.

const ROLE_COOKIE = "auth_role";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = req.cookies.get(ROLE_COOKIE)?.value;

  // ── Not logged in → send to /login ────────────────────────────────────────
  if (!role) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Admin routes → require ADMIN role ─────────────────────────────────────
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    const dashUrl = req.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.searchParams.delete("from");
    return NextResponse.redirect(dashUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
