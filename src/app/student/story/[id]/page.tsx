import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignments, scenes, recordings, stories } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { StoryPlayer } from "@/components/StoryPlayer";

export default async function StudentStoryPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  const [assignment] = await db
    .select()
    .from(assignments)
    .where(
      and(
        eq(assignments.storyId, params.id),
        eq(assignments.studentId, session!.user.id)
      )
    );
  if (!assignment) notFound();

  const [story] = await db
    .select()
    .from(stories)
    .where(eq(stories.id, params.id));

  const sceneRows = await db
    .select()
    .from(scenes)
    .where(eq(scenes.storyId, params.id))
    .orderBy(asc(scenes.order));

  const recs = await db
    .select()
    .from(recordings)
    .where(eq(recordings.assignmentId, assignment.id));
  const recBySceneId = new Map(recs.map((r) => [r.sceneId, r.audioUrl]));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">{story?.title}</h1>
      <div className="mt-6">
        <StoryPlayer
          scenes={sceneRows.map((s) => ({
            id: s.id,
            subtitle: s.subtitle,
            imageUrl: s.imageUrl,
            audioUrl: s.audioUrl,
            studentAudioUrl: recBySceneId.get(s.id) ?? null,
          }))}
          mode="practice"
          assignmentId={assignment.id}
        />
      </div>
    </div>
  );
}
