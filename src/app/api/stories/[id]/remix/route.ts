import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories, scenes } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { generateSceneAudio, regenerateSubtitles } from "@/lib/ai";

export const maxDuration = 300;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { language, difficulty, title, voice } = (await req.json()) as {
    language: string;
    difficulty: number;
    title?: string;
    voice?: "male" | "female";
  };
  const vox: "male" | "female" = voice === "male" ? "male" : "female";

  const [source] = await db
    .select()
    .from(stories)
    .where(
      and(eq(stories.id, params.id), eq(stories.creatorId, session.user.id))
    );
  if (!source) return new NextResponse("Not found", { status: 404 });

  const sourceScenes = await db
    .select()
    .from(scenes)
    .where(eq(scenes.storyId, source.id))
    .orderBy(asc(scenes.order));

  if (sourceScenes.length === 0) {
    return new NextResponse("Source story has no scenes", { status: 400 });
  }

  const newSubtitles = await regenerateSubtitles({
    title: title ?? source.title,
    description: source.description,
    language,
    difficulty,
    imagePrompts: sourceScenes.map((s) => s.imagePrompt),
  });

  const [newStory] = await db
    .insert(stories)
    .values({
      title: title?.trim() || `${source.title} — ${language} L${difficulty}`,
      description: source.description,
      difficulty,
      language,
      imageStyle: source.imageStyle,
      voice: vox,
      creatorId: session.user.id,
    })
    .returning();

  const sceneInserts = await Promise.all(
    sourceScenes.map(async (sourceScene, idx) => {
      const subtitle = newSubtitles[idx] ?? "";
      const audioUrl = await generateSceneAudio(
        subtitle,
        `stories/${newStory.id}/scene-${idx}.wav`,
        vox
      ).catch((err) => {
        console.error(`[remix scene ${idx}] audio failed:`, err);
        return null;
      });
      return {
        storyId: newStory.id,
        subtitle,
        imagePrompt: sourceScene.imagePrompt,
        imageUrl: sourceScene.imageUrl,
        audioUrl,
        order: idx,
      };
    })
  );

  await db.insert(scenes).values(sceneInserts);
  return NextResponse.json({ id: newStory.id });
}
