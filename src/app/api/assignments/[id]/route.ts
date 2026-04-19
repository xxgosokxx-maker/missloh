import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignments } from "@/lib/db/schema";
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
    .delete(assignments)
    .where(
      and(
        eq(assignments.id, params.id),
        eq(assignments.assignedBy, session.user.id)
      )
    );

  return NextResponse.json({ ok: true });
}
