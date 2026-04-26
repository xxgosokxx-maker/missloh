"use server";

import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, classCodes } from "@/lib/db/schema";
import { verifyPin } from "@/lib/pin";
import { createStudentSession } from "@/lib/studentSession";
import { getIp, isRateLimited, recordAttempt } from "@/lib/rateLimit";

const GENERIC_ERROR = "Invalid class code or PIN.";

function constantTimeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    const len = Math.max(ab.length, bb.length, 1);
    const pa = Buffer.alloc(len);
    const pb = Buffer.alloc(len);
    ab.copy(pa);
    bb.copy(pb);
    timingSafeEqual(pa, pb);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export async function studentSignInAction(
  _prev: unknown,
  formData: FormData
): Promise<{ ok: false; error: string } | void> {
  const classCode = String(formData.get("classCode") ?? "");
  const pin = String(formData.get("pin") ?? "");

  const ip = getIp(await headers());

  if (await isRateLimited(ip, "pin")) {
    return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
  }

  const validCodes = await db.select({ code: classCodes.code }).from(classCodes);
  let codeOk = false;
  for (const row of validCodes) {
    if (constantTimeEquals(classCode, row.code)) codeOk = true;
  }
  if (validCodes.length === 0) {
    constantTimeEquals(classCode, classCode);
  }

  if (!codeOk) {
    await recordAttempt(ip, "class_code", false);
    await recordAttempt(ip, "pin", false);
    return { ok: false, error: GENERIC_ERROR };
  }

  const pinStudents = await db
    .select({ id: users.id, pinHash: users.pinHash })
    .from(users)
    .where(eq(users.authKind, "pin"));

  let matchedId: string | null = null;
  for (const s of pinStudents) {
    const ok = await verifyPin(pin, s.pinHash);
    if (ok && !matchedId) matchedId = s.id;
  }

  if (!matchedId) {
    await recordAttempt(ip, "pin", false);
    return { ok: false, error: GENERIC_ERROR };
  }

  await recordAttempt(ip, "pin", true);
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, matchedId));
  await createStudentSession(matchedId);
  redirect("/student");
}
