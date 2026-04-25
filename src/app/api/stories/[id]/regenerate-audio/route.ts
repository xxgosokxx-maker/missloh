import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scenes, stories } from "@/lib/db/schema";
import { clampLevel, generateSceneAudio, type VoiceGender } from "@/lib/ai";

export const maxDuration = 120;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const [story] = await db
    .select()
    .from(stories)
    .where(
      and(eq(stories.id, id), eq(stories.creatorId, session.user.id))
    );
  if (!story) return new NextResponse("Not found", { status: 404 });

  const sceneRows = await db
    .select()
    .from(scenes)
    .where(eq(scenes.storyId, story.id))
    .orderBy(asc(scenes.order));

  const results = await Promise.allSettled(
    sceneRows.map(async (s) => {
      const pathname = `stories/${story.id}/${s.id}-${Date.now()}.wav`;
      const audioUrl = await generateSceneAudio(
        s.subtitle,
        pathname,
        story.language,
        clampLevel(story.difficulty),
        story.voice as VoiceGender
      );
      await db.update(scenes).set({ audioUrl }).where(eq(scenes.id, s.id));
      return { id: s.id, audioUrl };
    })
  );

  const updated: { id: string; audioUrl: string }[] = [];
  const errors: string[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      updated.push(r.value);
    } else {
      errors.push(
        r.reason instanceof Error ? r.reason.message : String(r.reason)
      );
    }
  }

  return NextResponse.json({
    regenerated: updated.length,
    failed: errors.length,
    errors,
    scenes: updated,
  });
}
