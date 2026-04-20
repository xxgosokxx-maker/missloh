import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordings, scenes, stories } from "@/lib/db/schema";
import { evaluateRecording } from "@/lib/aiScore";

export const maxDuration = 120;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "student") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const [row] = await db
    .select({
      recordingId: recordings.id,
      audioUrl: recordings.audioUrl,
      subtitle: scenes.subtitle,
      language: stories.language,
      difficulty: stories.difficulty,
    })
    .from(recordings)
    .innerJoin(scenes, eq(scenes.id, recordings.sceneId))
    .innerJoin(stories, eq(stories.id, scenes.storyId))
    .where(and(eq(recordings.id, id), eq(recordings.studentId, session.user.id)));

  if (!row) return new NextResponse("Forbidden", { status: 403 });

  const result = await evaluateRecording({
    language: row.language,
    subtitle: row.subtitle,
    audioUrl: row.audioUrl,
    difficulty: row.difficulty,
  });

  if (!result.audible) {
    return NextResponse.json(result);
  }

  await db
    .update(recordings)
    .set({
      aiScore: result.score,
      aiAccuracy: result.accuracy,
      aiClarity: result.clarity,
      aiFeedback: result.feedback,
      aiTranscript: result.transcript,
      aiEvaluatedAt: new Date(),
    })
    .where(eq(recordings.id, row.recordingId));

  return NextResponse.json(result);
}
