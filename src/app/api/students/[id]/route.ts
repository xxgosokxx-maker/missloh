import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, params.id), eq(users.role, "student")));
  if (!row) {
    return new NextResponse("Not found", { status: 404 });
  }

  await db.delete(users).where(eq(users.id, params.id));
  return NextResponse.json({ ok: true });
}
