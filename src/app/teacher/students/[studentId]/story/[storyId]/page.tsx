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
import { StoryPlayer } from "@/components/StoryPlayer";

export default async function TeacherReviewPage({
  params,
}: {
  params: { studentId: string; storyId: string };
}) {
  const session = await auth();

  const [story] = await db
    .select()
    .from(stories)
    .where(
      and(
        eq(stories.id, params.storyId),
        eq(stories.creatorId, session!.user.id)
      )
    );
  if (!story) notFound();

  const [student] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, params.studentId));
  if (!student) notFound();

  const [assignment] = await db
    .select()
    .from(assignments)
    .where(
      and(
        eq(assignments.studentId, params.studentId),
        eq(assignments.storyId, params.storyId)
      )
    );

  const sceneRows = await db
    .select()
    .from(scenes)
    .where(eq(scenes.storyId, story.id))
    .orderBy(asc(scenes.order));

  const recs = assignment
    ? await db
        .select()
        .from(recordings)
        .where(eq(recordings.assignmentId, assignment.id))
    : [];
  const recBySceneId = new Map(recs.map((r) => [r.sceneId, r.audioUrl]));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-2 text-sm text-slate-500">
        Reviewing <strong>{student.name}</strong>
      </div>
      <h1 className="text-2xl font-semibold">{story.title}</h1>
      <div className="mt-6">
        <StoryPlayer
          scenes={sceneRows.map((s) => ({
            id: s.id,
            subtitle: s.subtitle,
            imageUrl: s.imageUrl,
            audioUrl: s.audioUrl,
            studentAudioUrl: recBySceneId.get(s.id) ?? null,
          }))}
          mode="review"
        />
      </div>
    </div>
  );
}
