import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories, scenes } from "@/lib/db/schema";
import { generateSceneAudio } from "@/lib/ai";

export const maxDuration = 300;

type SceneInput = { subtitle: string; imageUrl: string };

type Body = {
  title?: string;
  language?: string;
  difficulty?: number;
  voice?: "male" | "female";
  scenes?: SceneInput[];
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = (await req.json()) as Body;
  const title = body.title?.trim();
  const language = body.language?.trim();
  const difficulty = Number(body.difficulty);
  const voice: "male" | "female" = body.voice === "male" ? "male" : "female";
  const uploadedScenes = (body.scenes ?? []).filter(
    (s) => typeof s?.subtitle === "string" && typeof s?.imageUrl === "string"
  );

  if (!title) return new NextResponse("Title is required", { status: 400 });
  if (!language) return new NextResponse("Language is required", { status: 400 });
  if (!Number.isFinite(difficulty) || difficulty < 1 || difficulty > 9) {
    return new NextResponse("Difficulty must be 1–9", { status: 400 });
  }
  if (uploadedScenes.length === 0) {
    return new NextResponse("At least one scene is required", { status: 400 });
  }
  for (const s of uploadedScenes) {
    if (!s.subtitle.trim())
      return new NextResponse("Every scene needs a subtitle", { status: 400 });
    if (!/^https?:\/\//.test(s.imageUrl))
      return new NextResponse("Invalid image URL", { status: 400 });
  }

  const [story] = await db
    .insert(stories)
    .values({
      title,
      description: "",
      difficulty,
      language,
      imageStyle: "Custom",
      voice,
      creatorId: session.user.id,
    })
    .returning();

  const audioUrls = await Promise.all(
    uploadedScenes.map((s, idx) =>
      generateSceneAudio(
        s.subtitle.trim(),
        `stories/${story.id}/scene-${idx}.wav`,
        voice
      ).catch((err) => {
        console.error(`[upload scene ${idx}] audio failed:`, err);
        return null as string | null;
      })
    )
  );

  await db.insert(scenes).values(
    uploadedScenes.map((s, idx) => ({
      storyId: story.id,
      subtitle: s.subtitle.trim(),
      imagePrompt: "",
      imageUrl: s.imageUrl,
      audioUrl: audioUrls[idx],
      order: idx,
    }))
  );

  return NextResponse.json({ id: story.id });
}
