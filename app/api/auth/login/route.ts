import { client } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function hashPassword(password: string, salt: string): string {
  return createHash("sha256").update(password + salt).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    console.log("🔑 [Janus Auth API] Login request received for email:", email);

    if (!email || !password) {
      console.warn("⚠️ [Janus Auth API] Missing email or password");
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await client.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      console.warn("❌ [Janus Auth API] User not found or no password set for:", email);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check primary salt and fallback salt for consistency across envs
    const primarySalt = process.env.AUTH_SECRET || "ig-internal-salt";
    const hashedPrimary = hashPassword(password, primarySalt);
    const hashedFallback = hashPassword(password, "ig-internal-salt");

    if (hashedPrimary !== user.password && hashedFallback !== user.password) {
      console.warn("❌ [Janus Auth API] Password mismatch for:", email);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await setSession({
      clerkId: user.clerkId,
      firstname: user.firstname || "",
      lastname: user.lastname || "",
      email: user.email,
    });

    console.log("✅ [Janus Auth API] Session set successfully for user:", user.email, "clerkId:", user.clerkId);

    return NextResponse.json({ status: 200, firstname: user.firstname, lastname: user.lastname });
  } catch (err: any) {
    console.error("💥 [Janus Auth API] Unexpected error during login:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
