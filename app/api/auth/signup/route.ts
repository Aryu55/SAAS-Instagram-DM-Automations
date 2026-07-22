import { client } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstname, lastname } = await req.json();

    if (!email || !password || !firstname || !lastname) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await client.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const clerkId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const user = await client.user.create({
      data: {
        clerkId,
        email: normalizedEmail,
        firstname,
        lastname,
        password: hashedPassword,
        subscription: {
          create: {
            plan: "PRO",
          },
        },
      },
      select: {
        clerkId: true,
        firstname: true,
        lastname: true,
        email: true,
      },
    });

    await setSession({
      clerkId: user.clerkId,
      firstname: user.firstname || "",
      lastname: user.lastname || "",
      email: user.email,
    });

    return NextResponse.json({ status: 201, firstname: user.firstname, lastname: user.lastname });
  } catch (err: any) {
    console.error("💥 [Janus Auth API] Unexpected error during signup:", err);
    return NextResponse.json({ error: "An unexpected signup error occurred" }, { status: 500 });
  }
}
