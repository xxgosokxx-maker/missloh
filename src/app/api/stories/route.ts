import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories, scenes } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  generateSceneAudio,
  generateStoryScenes,
  renderSceneImage,
  uploadRenderedImage,
  type RenderedImage,
} from "@/lib/ai";

export const maxDuration = 300;

const MAX_TITLE_LEN = 200;

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
  const { title, description, difficulty, language, imageStyle, voice } =
    body as {
      title: string;
      description: string;
      difficulty: number;
      language: string;
      imageStyle: string;
      voice?: "male" | "female";
    };
  const trimmedTitle = typeof title === "string" ? title.trim() : "";
  if (!trimmedTitle) {
    return new NextResponse("Title required", { status: 400 });
  }
  if (trimmedTitle.length > MAX_TITLE_LEN) {
    return new NextResponse(
      `Title too long (max ${MAX_TITLE_LEN} characters)`,
      { status: 400 }
    );
  }
  const vox: "male" | "female" = voice === "male" ? "male" : "female";

  const { characters, scenes: generatedScenes } = await generateStoryScenes({
    title: trimmedTitle,
    description,
    difficulty,
    language,
    imageStyle,
  });

  const [story] = await db
    .insert(stories)
    .values({
      title: trimmedTitle,
      description,
      difficulty,
      language,
      imageStyle,
      voice: vox,
      creatorId: session.user.id,
    })
    .returning();

  const audioPromises = generatedScenes.map((s, idx) =>
    generateSceneAudio(
      s.subtitle,
      `stories/${story.id}/scene-${idx}.wav`,
      language,
      vox
    ).catch((err) => {
      console.error(`[scene ${idx}] audio failed:`, err);
      return null as string | null;
    })
  );

  // Scene 0 is rendered first because its bytes reference-guide the rest
  // (character + style consistency). Its upload runs in parallel with the
  // remaining Gemini calls — the reference is the in-memory buffer, not the URL.
  const scenePath = (idx: number) =>
    `stories/${story.id}/scene-${idx}.webp`;

  let anchor: RenderedImage | null = null;
  try {
    anchor = await renderSceneImage({
      imagePrompt: generatedScenes[0].imagePrompt,
      imageStyle,
      characters,
    });
  } catch (err) {
    console.error(`[scene 0] image failed:`, err);
  }

  const imagePromises: Promise<string | null>[] = generatedScenes.map(
    (s, idx) => {
      if (idx === 0) {
        return anchor
          ? uploadRenderedImage(anchor, scenePath(0)).catch((err) => {
              console.error(`[scene 0] upload failed:`, err);
              return null;
            })
          : Promise.resolve(null);
      }
      return (async () => {
        try {
          const rendered = await renderSceneImage({
            imagePrompt: s.imagePrompt,
            imageStyle,
            characters,
            referenceImage: anchor ?? undefined,
          });
          return await uploadRenderedImage(rendered, scenePath(idx));
        } catch (err) {
          console.error(`[scene ${idx}] image failed:`, err);
          return null;
        }
      })();
    }
  );
  const imageUrls = await Promise.all(imagePromises);

  const audioUrls = await Promise.all(audioPromises);

  await db.insert(scenes).values(
    generatedScenes.map((s, idx) => ({
      storyId: story.id,
      subtitle: s.subtitle,
      imagePrompt: s.imagePrompt,
      imageUrl: imageUrls[idx],
      audioUrl: audioUrls[idx],
      order: idx,
    }))
  );

  return NextResponse.json({ id: story.id });
}
