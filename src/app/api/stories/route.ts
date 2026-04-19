import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories, scenes } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  generateSceneAudio,
  generateSceneImage,
  generateStoryScenes,
} from "@/lib/ai";

export const maxDuration = 300;

export async function GET() {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const rows = await db
    .select()
    .from(stories)
    .where(eq(stories.creatorId, session.user.id))
    .orderBy(desc(stories.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = await req.json();
  const { title, description, difficulty, language, imageStyle } = body as {
    title: string;
    description: string;
    difficulty: number;
    language: string;
    imageStyle: string;
  };

  const generatedScenes = await generateStoryScenes({
    title,
    description,
    difficulty,
    language,
    imageStyle,
  });

  const [story] = await db
    .insert(stories)
    .values({
      title,
      description,
      difficulty,
      language,
      imageStyle,
      creatorId: session.user.id,
    })
    .returning();

  const sceneInserts = await Promise.all(
    generatedScenes.map(async (s, idx) => {
      const [imageUrl, audioUrl] = await Promise.all([
        generateSceneImage(
          s.imagePrompt,
          imageStyle,
          `stories/${story.id}/scene-${idx}.png`
        ).catch(() => null),
        generateSceneAudio(
          s.subtitle,
          `stories/${story.id}/scene-${idx}.wav`
        ).catch(() => null),
      ]);
      return {
        storyId: story.id,
        subtitle: s.subtitle,
        imagePrompt: s.imagePrompt,
        imageUrl,
        audioUrl,
        order: idx,
      };
    })
  );

  await db.insert(scenes).values(sceneInserts);

  return NextResponse.json({ id: story.id });
}
