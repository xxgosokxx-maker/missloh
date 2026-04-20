import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignments, scenes, recordings, stories } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StoryPlayer } from "@/components/StoryPlayer";

export default async function StudentStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const [assignment] = await db
    .select()
    .from(assignments)
    .where(
      and(
        eq(assignments.storyId, id),
        eq(assignments.studentId, session!.user.id)
      )
    );
  if (!assignment) notFound();

  const [story] = await db
    .select()
    .from(stories)
    .where(eq(stories.id, id));

  const sceneRows = await db
    .select()
    .from(scenes)
    .where(eq(scenes.storyId, id))
    .orderBy(asc(scenes.order));

  const recs = await db
    .select()
    .from(recordings)
    .where(eq(recordings.assignmentId, assignment.id));
  const recBySceneId = new Map(recs.map((r) => [r.sceneId, r]));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/student"
          className="text-xs font-medium text-ink-500 transition hover:text-ink-900"
        >
          ← Back to your stories
        </Link>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink-900">
          {story?.title}
        </h1>
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
        mode="practice"
        assignmentId={assignment.id}
      />
    </div>
  );
}
