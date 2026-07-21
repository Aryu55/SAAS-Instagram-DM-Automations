import { clearSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  await clearSession();
  const signInUrl = new URL("/sign-in", request.url);
  return NextResponse.redirect(signInUrl);
}

export async function POST() {
  await clearSession();
  return NextResponse.json({ status: 200 });
}
