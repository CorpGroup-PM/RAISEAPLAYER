import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const role = req.cookies.get("role")?.value; // "admin" or "user"
  const { pathname } = req.nextUrl;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  const isAdminPage = pathname.startsWith("/admin");
  const isUserPage =
    pathname.startsWith("/dashboard") || pathname.startsWith("/profile");

  // 🚫 Redirect logged-in users away from login/register
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 🔒 Protect admin routes
  if (isAdminPage) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 🔒 Protect user routes
  if (isUserPage && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
