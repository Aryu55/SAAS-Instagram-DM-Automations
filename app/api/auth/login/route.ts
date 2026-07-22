import { client } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";

function legacyHashPassword(password: string, salt: string): string {
  return createHash("sha256").update(password + salt).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (process.env.NODE_ENV !== "production") {
      console.log("🔑 [Janus Auth API] Login request received for email:", email);
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await client.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    let isPasswordValid = false;

    // Check if password is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$")) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Legacy SHA-256 check
      const primarySalt = process.env.AUTH_SECRET || "ig-internal-salt";
      const hashedPrimary = legacyHashPassword(password, primarySalt);
      const hashedFallback = legacyHashPassword(password, "ig-internal-salt");

      if (hashedPrimary === user.password || hashedFallback === user.password) {
        isPasswordValid = true;
        // Transparently upgrade legacy SHA-256 hash to bcrypt
        try {
          const newBcryptHash = await bcrypt.hash(password, 12);
          await client.user.update({
            where: { id: user.id },
            data: { password: newBcryptHash },
          });
        } catch (upgradeErr) {
          console.error("Failed to upgrade legacy password hash:", upgradeErr);
        }
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await setSession({
      clerkId: user.clerkId,
      firstname: user.firstname || "",
      lastname: user.lastname || "",
      email: user.email,
    });

    return NextResponse.json({ status: 200, firstname: user.firstname, lastname: user.lastname });
  } catch (err: any) {
    console.error("💥 [Janus Auth API] Unexpected error during login:", err);
    return NextResponse.json({ error: "An unexpected authentication error occurred" }, { status: 500 });
  }
}
