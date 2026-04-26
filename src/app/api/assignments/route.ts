import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignments, stories, users } from "@/lib/db/schema";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { studentId, storyId } = (await req.json()) as {
    studentId?: string;
    storyId?: string;
  };
  if (typeof studentId !== "string" || typeof storyId !== "string") {
    return new NextResponse("studentId and storyId required", { status: 400 });
  }

  const [story] = await db
    .select({ id: stories.id })
    .from(stories)
    .where(
      and(eq(stories.id, storyId), eq(stories.creatorId, session.user.id))
    );
  if (!story) return new NextResponse("Story not found", { status: 404 });

  const [student] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, studentId), eq(users.role, "student")));
  if (!student) return new NextResponse("Student not found", { status: 404 });

  const [row] = await db
    .insert(assignments)
    .values({ studentId, storyId, assignedBy: session.user.id })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json(row ?? { ok: true });
}
