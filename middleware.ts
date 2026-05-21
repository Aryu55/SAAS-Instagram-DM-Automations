import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("user_session");
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/payment") ||
    pathname.startsWith("/callback")
  ) {
    if (!session) {
      const signInUrl = new URL("/sign-in", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/payment/:path*",
    "/callback/:path*",
  ],
};
