import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  await db
    .delete(stories)
    .where(
      and(eq(stories.id, params.id), eq(stories.creatorId, session.user.id))
    );

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { title } = (await req.json()) as { title?: string };
  const trimmed = title?.trim();
  if (!trimmed) {
    return new NextResponse("Title required", { status: 400 });
  }

  await db
    .update(stories)
    .set({ title: trimmed })
    .where(
      and(eq(stories.id, params.id), eq(stories.creatorId, session.user.id))
    );

  return NextResponse.json({ ok: true });
}
