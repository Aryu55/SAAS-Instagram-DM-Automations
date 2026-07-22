import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  emailAddresses: { emailAddress: string }[];
}

const getSecret = () => process.env.SESSION_SECRET || process.env.AUTH_SECRET || "janus-secure-session-secret-key-2026";

function signPayload(payload: string): string {
  const hmac = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

function verifyPayload(signedStr: string): string | null {
  const lastDot = signedStr.lastIndexOf(".");
  if (lastDot === -1) {
    // Backward compatibility for legacy unsigned sessions if valid JSON
    try {
      JSON.parse(Buffer.from(signedStr, "base64").toString("utf-8"));
      return signedStr;
    } catch {
      return null;
    }
  }

  const payload = signedStr.slice(0, lastDot);
  const signature = signedStr.slice(lastDot + 1);

  const expectedHmac = createHmac("sha256", getSecret()).update(payload).digest("hex");

  if (signature.length !== expectedHmac.length) return null;
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedHmac);

  if (!timingSafeEqual(sigBuf, expBuf)) return null;
  return payload;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const rawSessionStr = cookieStore.get("user_session")?.value;
  if (!rawSessionStr) return null;

  try {
    const verifiedPayload = verifyPayload(rawSessionStr);
    if (!verifiedPayload) return null;

    const data = JSON.parse(Buffer.from(verifiedPayload, "base64").toString("utf-8"));
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
  const base64Data = Buffer.from(JSON.stringify(sessionData)).toString("base64");
  const signedSessionStr = signPayload(base64Data);

  cookieStore.set("user_session", signedSessionStr, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSession() {
  const cookieStore = cookies();
  cookieStore.delete("user_session");
}
