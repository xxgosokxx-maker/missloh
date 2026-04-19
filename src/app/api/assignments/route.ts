import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignments } from "@/lib/db/schema";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { studentId, storyId } = (await req.json()) as {
    studentId: string;
    storyId: string;
  };

  const [row] = await db
    .insert(assignments)
    .values({ studentId, storyId, assignedBy: session.user.id })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json(row ?? { ok: true });
}
