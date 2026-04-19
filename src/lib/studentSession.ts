import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function isSecureDeployment(): boolean {
  const url =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (url) return url.startsWith("https://");
  return process.env.NODE_ENV === "production";
}

export async function createStudentSession(userId: string): Promise<void> {
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ sessionToken, userId, expires });

  const secure = isSecureDeployment();
  const cookieName = secure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  (await cookies()).set({
    name: cookieName,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires,
  });
}
