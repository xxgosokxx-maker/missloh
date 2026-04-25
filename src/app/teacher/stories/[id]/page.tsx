import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories, scenes } from "@/lib/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StoryPlayer } from "@/components/StoryPlayer";
import { AddSceneForm } from "@/components/AddSceneForm";
import { RegenerateAllAudioButton } from "@/components/RegenerateAllAudioButton";

export default async function TeacherStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const [story] = await db
    .select()
    .from(stories)
    .where(
      and(eq(stories.id, id), eq(stories.creatorId, session!.user.id))
    );
  if (!story) notFound();

  const sceneRows = await db
    .select()
    .from(scenes)
    .where(eq(scenes.storyId, story.id))
    .orderBy(asc(scenes.order));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/teacher"
          className="text-xs font-medium text-ink-500 transition hover:text-ink-900"
        >
          ← Back to stories
        </Link>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink-900">
          {story.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="badge">{story.language}</span>
            <span className="badge">Lv {story.difficulty}</span>
            <span className="badge">{story.imageStyle}</span>
          </div>
          <RegenerateAllAudioButton
            storyId={story.id}
            sceneCount={sceneRows.length}
          />
        </div>
      </div>
      <StoryPlayer
        scenes={sceneRows.map((s) => ({
          id: s.id,
          subtitle: s.subtitle,
          imageUrl: s.imageUrl,
          audioUrl: s.audioUrl,
        }))}
        mode="preview"
        storyId={story.id}
      />
      <AddSceneForm storyId={story.id} />
    </div>
  );
}
