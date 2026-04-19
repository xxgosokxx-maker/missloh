import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  stories,
  scenes,
  recordings,
  assignments,
  users,
} from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StoryPlayer } from "@/components/StoryPlayer";
import { EvaluateStoryButton } from "@/components/EvaluateStoryButton";
import { displayName } from "@/lib/names";

export default async function TeacherReviewPage({
  params,
}: {
  params: Promise<{ studentId: string; storyId: string }>;
}) {
  const { studentId, storyId } = await params;
  const session = await auth();

  const [story] = await db
    .select()
    .from(stories)
    .where(
      and(
        eq(stories.id, storyId),
        eq(stories.creatorId, session!.user.id)
      )
    );
  if (!story) notFound();

  const [student] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, studentId));
  if (!student) notFound();

  const [assignment] = await db
    .select()
    .from(assignments)
    .where(
      and(
        eq(assignments.studentId, studentId),
        eq(assignments.storyId, storyId)
      )
    );

  const sceneRows = await db
    .select()
    .from(scenes)
    .where(eq(scenes.storyId, story.id))
    .orderBy(asc(scenes.order));

  const recs = assignment
    ? await db
        .select({
          sceneId: recordings.sceneId,
          audioUrl: recordings.audioUrl,
          aiScore: recordings.aiScore,
          aiFeedback: recordings.aiFeedback,
          aiTranscript: recordings.aiTranscript,
        })
        .from(recordings)
        .where(eq(recordings.assignmentId, assignment.id))
    : [];
  const recBySceneId = new Map(recs.map((r) => [r.sceneId, r]));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/teacher/students"
          className="text-xs font-medium text-ink-500 transition hover:text-ink-900"
        >
          ← Back to students
        </Link>
        <div className="mt-2 text-xs uppercase tracking-wide text-ink-500">
          Reviewing
        </div>
        <h1 className="font-display text-4xl tracking-tight text-ink-900">
          {displayName(student.name)}
        </h1>
        <div className="mt-1 text-sm text-ink-600">
          on <span className="font-medium text-ink-800">{story.title}</span>
        </div>
        {assignment && (
          <div className="mt-4">
            <EvaluateStoryButton assignmentId={assignment.id} />
          </div>
        )}
      </div>
      <StoryPlayer
        scenes={sceneRows.map((s) => {
          const rec = recBySceneId.get(s.id);
          return {
            id: s.id,
            subtitle: s.subtitle,
            imageUrl: s.imageUrl,
            audioUrl: s.audioUrl,
            studentAudioUrl: rec?.audioUrl ?? null,
            aiScore: rec?.aiScore ?? null,
            aiFeedback: rec?.aiFeedback ?? null,
            aiTranscript: rec?.aiTranscript ?? null,
          };
        })}
        mode="review"
      />
    </div>
  );
}
