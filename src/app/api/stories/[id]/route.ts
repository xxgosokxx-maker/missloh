import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const MAX_TITLE_LEN = 200;

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;
  await db
    .delete(stories)
    .where(
      and(eq(stories.id, id), eq(stories.creatorId, session.user.id))
    );

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json()) as {
    title?: string;
    archived?: boolean;
  };

  const patch: { title?: string; archivedAt?: Date | null } = {};

  if (typeof body.title === "string") {
    const trimmed = body.title.trim();
    if (!trimmed) {
      return new NextResponse("Title required", { status: 400 });
    }
    if (trimmed.length > MAX_TITLE_LEN) {
      return new NextResponse(
        `Title too long (max ${MAX_TITLE_LEN} characters)`,
        { status: 400 }
      );
    }
    patch.title = trimmed;
  }

  if (typeof body.archived === "boolean") {
    patch.archivedAt = body.archived ? new Date() : null;
  }

  if (Object.keys(patch).length === 0) {
    return new NextResponse("No fields to update", { status: 400 });
  }

  await db
    .update(stories)
    .set(patch)
    .where(
      and(eq(stories.id, id), eq(stories.creatorId, session.user.id))
    );

  return NextResponse.json({ ok: true });
}
