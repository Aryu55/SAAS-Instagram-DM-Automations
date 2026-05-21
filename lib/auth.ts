import { cookies } from "next/headers";

export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  emailAddresses: { emailAddress: string }[];
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const sessionStr = cookieStore.get("user_session")?.value;
  if (!sessionStr) return null;

  try {
    const data = JSON.parse(Buffer.from(sessionStr, "base64").toString("utf-8"));
    return {
      id: data.clerkId,
      firstName: data.firstname,
      lastName: data.lastname,
      emailAddresses: [{ emailAddress: data.email }],
    };
  } catch (e) {
    return null;
  }
}

export async function setSession(user: {
  clerkId: string;
  firstname: string;
  lastname: string;
  email: string;
}) {
  const cookieStore = cookies();
  const sessionData = {
    clerkId: user.clerkId,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
  };
  const sessionStr = Buffer.from(JSON.stringify(sessionData)).toString("base64");

  cookieStore.set("user_session", sessionStr, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = cookies();
  cookieStore.delete("user_session");
}
