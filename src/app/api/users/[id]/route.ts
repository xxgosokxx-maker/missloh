import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const { name } = (await req.json()) as { name?: string };
  const trimmed = name?.trim();
  if (!trimmed) {
    return new NextResponse("Name required", { status: 400 });
  }

  await db.update(users).set({ name: trimmed }).where(eq(users.id, id));

  return NextResponse.json({ ok: true });
}
