import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { classCodes } from "@/lib/db/schema";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { code, label } = (await req.json()) as {
    code?: string;
    label?: string | null;
  };

  const update: { code?: string; label?: string | null } = {};
  if (code !== undefined) {
    const trimmed = code.trim();
    if (!trimmed || trimmed.length < 4) {
      return new NextResponse("Code must be at least 4 characters", {
        status: 400,
      });
    }
    update.code = trimmed;
  }
  if (label !== undefined) {
    update.label = label?.trim() ? label.trim() : null;
  }
  if (Object.keys(update).length === 0) {
    return new NextResponse("No fields to update", { status: 400 });
  }

  try {
    const [row] = await db
      .update(classCodes)
      .set(update)
      .where(eq(classCodes.id, params.id))
      .returning();
    if (!row) return new NextResponse("Not found", { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    const msg = (err as Error).message ?? "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return new NextResponse("Code already exists", { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  await db.delete(classCodes).where(eq(classCodes.id, params.id));
  return NextResponse.json({ ok: true });
}
