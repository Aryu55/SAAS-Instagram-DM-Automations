import { client } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + (process.env.AUTH_SECRET || "ig-internal-salt")).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstname, lastname } = await req.json();

    if (!email || !password || !firstname || !lastname) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const hashed = hashPassword(password);

    // Check if user already exists
    const existing = await client.user.findUnique({ where: { email } });

    if (existing) {
      // If old Clerk user with no password, let them claim the account
      if (!existing.password) {
        const updated = await client.user.update({
          where: { email },
          data: {
            password: hashed,
            firstname,
            lastname,
          },
          select: { clerkId: true, firstname: true, lastname: true, email: true },
        });

        await setSession({
          clerkId: updated.clerkId,
          firstname: updated.firstname || "",
          lastname: updated.lastname || "",
          email: updated.email,
        });

        return NextResponse.json({ status: 200, firstname: updated.firstname, lastname: updated.lastname });
      }

      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const clerkId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const user = await client.user.create({
      data: {
        clerkId,
        email,
        firstname,
        lastname,
        password: hashed,
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
