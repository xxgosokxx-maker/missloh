import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordings, assignments, scenes } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { isOwnBlobUrl } from "@/lib/blob";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "student") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { assignmentId, sceneId, audioUrl } = (await req.json()) as {
    assignmentId: string;
    sceneId: string;
    audioUrl: string;
  };

  if (!isOwnBlobUrl(audioUrl)) {
    return new NextResponse("Invalid audioUrl", { status: 400 });
  }

  const [assignment] = await db
    .select({ id: assignments.id, storyId: assignments.storyId })
    .from(assignments)
    .where(
      and(
        eq(assignments.id, assignmentId),
        eq(assignments.studentId, session.user.id)
      )
    );
  if (!assignment) return new NextResponse("Forbidden", { status: 403 });

  const [scene] = await db
    .select({ id: scenes.id })
    .from(scenes)
    .where(and(eq(scenes.id, sceneId), eq(scenes.storyId, assignment.storyId)));
  if (!scene) {
    return new NextResponse("Scene does not belong to this assignment", {
      status: 400,
    });
  }

  const [row] = await db
    .insert(recordings)
    .values({
      assignmentId,
      sceneId,
      studentId: session.user.id,
      audioUrl,
    })
    .onConflictDoUpdate({
      target: [recordings.assignmentId, recordings.sceneId],
      set: {
        audioUrl,
        recordedAt: new Date(),
        aiScore: null,
        aiAccuracy: null,
        aiClarity: null,
        aiFeedback: null,
        aiTranscript: null,
        aiEvaluatedAt: null,
      },
    })
    .returning();

  return NextResponse.json(row);
}
