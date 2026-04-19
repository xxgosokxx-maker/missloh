import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignments, recordings, scenes, stories } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { evaluateRecording } from "@/lib/aiScore";

export const maxDuration = 120;

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const [assignment] = await db
    .select({
      id: assignments.id,
      storyId: assignments.storyId,
      language: stories.language,
    })
    .from(assignments)
    .innerJoin(stories, eq(stories.id, assignments.storyId))
    .where(
      and(
        eq(assignments.id, params.id),
        eq(stories.creatorId, session.user.id)
      )
    );
  if (!assignment) return new NextResponse("Forbidden", { status: 403 });

  const rows = await db
    .select({
      recordingId: recordings.id,
      audioUrl: recordings.audioUrl,
      subtitle: scenes.subtitle,
    })
    .from(recordings)
    .innerJoin(scenes, eq(scenes.id, recordings.sceneId))
    .where(eq(recordings.assignmentId, assignment.id));

  const results = await Promise.allSettled(
    rows.map((r) =>
      evaluateRecording({
        language: assignment.language,
        subtitle: r.subtitle,
        audioUrl: r.audioUrl,
      }).then(async (out) => {
        await db
          .update(recordings)
          .set({
            aiScore: out.score,
            aiFeedback: out.feedback,
            aiTranscript: out.transcript,
            aiEvaluatedAt: new Date(),
          })
          .where(eq(recordings.id, r.recordingId));
        return out;
      })
    )
  );

  let evaluated = 0;
  let failed = 0;
  const errors: string[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") evaluated++;
    else {
      failed++;
      errors.push(
        r.reason instanceof Error ? r.reason.message : String(r.reason)
      );
    }
  }

  return NextResponse.json({ evaluated, failed, errors });
}
