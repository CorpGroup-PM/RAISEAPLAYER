import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth uses JWT Bearer tokens stored in memory / localStorage — not cookies.
// Next.js middleware runs on the Edge and cannot access localStorage or
// in-memory state, so cookie-based route guarding is not applicable here.
//
// Route protection is handled client-side via the useAuth() hook:
//   - Unauthenticated users are redirected to /login by each protected page.
//   - Admin-only pages check req.user.role from the API response.
//
// This middleware is kept as a pass-through so it can be extended later
// (e.g., if auth is migrated to HTTP-only cookies).

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
