import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("user_session");
  const { pathname } = request.nextUrl;

  // 1. If user ALREADY has session and visits /sign-in or /sign-up, auto-redirect to /dashboard
  if (session && (pathname === "/sign-in" || pathname === "/sign-up")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. If user DOES NOT have session and visits protected routes, redirect to /sign-in
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/payment") ||
    pathname.startsWith("/callback")
  ) {
    if (!session) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/sign-in",
    "/sign-up",
    "/dashboard/:path*",
    "/api/payment/:path*",
    "/callback/:path*",
  ],
};
