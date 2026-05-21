import { client } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + (process.env.AUTH_SECRET || "ig-internal-salt")).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await client.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const hashed = hashPassword(password);
    if (hashed !== user.password) {
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
