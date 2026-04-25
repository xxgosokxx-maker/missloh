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
  const body = (await req.json()) as { name?: string; tag?: string | null };

  const update: { name?: string; tag?: string | null } = {};

  if (body.name !== undefined) {
    const trimmed = body.name?.trim();
    if (!trimmed) {
      return new NextResponse("Name required", { status: 400 });
    }
    update.name = trimmed;
  }

  if (body.tag !== undefined) {
    if (body.tag === null || body.tag === "") {
      update.tag = null;
    } else if (body.tag === "French" || body.tag === "Mandarin") {
      update.tag = body.tag;
    } else {
      return new NextResponse("Invalid tag", { status: 400 });
    }
  }

  if (Object.keys(update).length === 0) {
    return new NextResponse("No updatable fields", { status: 400 });
  }

  await db.update(users).set(update).where(eq(users.id, id));

  return NextResponse.json({ ok: true });
}
