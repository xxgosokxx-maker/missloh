import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { loginAttempts } from "@/lib/db/schema";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;

export type LoginAttemptKind = "class_code" | "pin";

export function getIp(headers: { get(name: string): string | null }): string {
  const fwd = headers.get("x-forwarded-for") ?? "";
  const first = fwd.split(",")[0]?.trim();
  if (first) return first;
  const real = headers.get("x-real-ip")?.trim();
  return real || "unknown";
}

export async function isRateLimited(
  ip: string,
  kind: LoginAttemptKind
): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.ip, ip),
        eq(loginAttempts.kind, kind),
        eq(loginAttempts.succeeded, false),
        gte(loginAttempts.attemptedAt, since)
      )
    );
  return (row?.count ?? 0) >= MAX_FAILS;
}

export async function recordAttempt(
  ip: string,
  kind: LoginAttemptKind,
  succeeded: boolean
): Promise<void> {
  await db.insert(loginAttempts).values({ ip, kind, succeeded });
}
