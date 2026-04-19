import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const { role } = (await req.json()) as { role: "teacher" | "student" };
  if (role !== "teacher" && role !== "student") {
    return new NextResponse("Invalid role", { status: 400 });
  }

  await db.update(users).set({ role }).where(eq(users.id, session.user.id));
  return NextResponse.json({ ok: true });
}
