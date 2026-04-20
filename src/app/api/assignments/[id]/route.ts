import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

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
    .delete(assignments)
    .where(
      and(
        eq(assignments.id, id),
        eq(assignments.assignedBy, session.user.id)
      )
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
  const body = (await req.json()) as { rating?: number | null };
  const raw = body.rating;
  const rating =
    raw === null || raw === undefined
      ? null
      : Math.max(0, Math.min(5, Math.round(Number(raw) * 2) / 2));

  if (rating !== null && Number.isNaN(rating)) {
    return new NextResponse("Invalid rating", { status: 400 });
  }

  await db
    .update(assignments)
    .set({ rating })
    .where(
      and(
        eq(assignments.id, id),
        eq(assignments.assignedBy, session.user.id)
      )
    );

  return NextResponse.json({ ok: true, rating });
}
