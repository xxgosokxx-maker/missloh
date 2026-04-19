import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories, scenes } from "@/lib/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { StoryPlayer } from "@/components/StoryPlayer";

export default async function TeacherStoryPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const [story] = await db
    .select()
    .from(stories)
    .where(
      and(eq(stories.id, params.id), eq(stories.creatorId, session!.user.id))
    );
  if (!story) notFound();

  const sceneRows = await db
    .select()
    .from(scenes)
    .where(eq(scenes.storyId, story.id))
    .orderBy(asc(scenes.order));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">{story.title}</h1>
      <p className="mt-1 text-slate-600">{story.description}</p>
      <div className="mt-6">
        <StoryPlayer
          scenes={sceneRows.map((s) => ({
            id: s.id,
            subtitle: s.subtitle,
            imageUrl: s.imageUrl,
            audioUrl: s.audioUrl,
          }))}
          mode="preview"
        />
      </div>
    </div>
  );
}
