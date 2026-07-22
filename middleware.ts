import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("user_session");
  const { pathname } = request.nextUrl;

  // 1. If user ALREADY has session and visits /sign-in or /sign-up, auto-redirect to /dashboard
  if (session && (pathname === "/sign-in" || pathname === "/sign-up")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. If user DOES NOT have session and visits protected routes or protected API routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/payment") ||
    pathname.startsWith("/api/predict-virality") ||
    pathname.startsWith("/api/run-pipeline") ||
    pathname.startsWith("/api/analytics") ||
    pathname.startsWith("/callback")
  ) {
    if (!session) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/sign-in",
    "/sign-up",
    "/api/payment/:path*",
    "/api/predict-virality",
    "/api/run-pipeline",
    "/api/analytics/:path*",
    "/callback/:path*",
  ],
};
