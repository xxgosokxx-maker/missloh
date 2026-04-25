import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scenes, stories } from "@/lib/db/schema";
import { clampLevel, generateSceneAudio, type VoiceGender } from "@/lib/ai";

export const maxDuration = 120;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json()) as {
    subtitle?: string;
    imageUrl?: string;
  };
  const subtitle = body.subtitle?.trim();
  const imageUrl = body.imageUrl?.trim();

  if (!subtitle) {
    return new NextResponse("Subtitle required", { status: 400 });
  }
  if (!imageUrl || !/^https?:\/\//.test(imageUrl)) {
    return new NextResponse("Invalid imageUrl", { status: 400 });
  }

  const [story] = await db
    .select()
    .from(stories)
    .where(
      and(eq(stories.id, id), eq(stories.creatorId, session.user.id))
    );
  if (!story) return new NextResponse("Not found", { status: 404 });

  const [last] = await db
    .select({ order: scenes.order })
    .from(scenes)
    .where(eq(scenes.storyId, story.id))
    .orderBy(desc(scenes.order))
    .limit(1);
  const order = (last?.order ?? -1) + 1;

  const audioUrl = await generateSceneAudio(
    subtitle,
    `stories/${story.id}/scene-${order}-${Date.now()}.wav`,
    story.language,
    clampLevel(story.difficulty),
    story.voice as VoiceGender
  ).catch((err) => {
    console.error(`[add scene] audio failed:`, err);
    return null as string | null;
  });

  const [scene] = await db
    .insert(scenes)
    .values({
      storyId: story.id,
      subtitle,
      imagePrompt: "",
      imageUrl,
      audioUrl,
      order,
    })
    .returning();

  return NextResponse.json({
    id: scene.id,
    subtitle: scene.subtitle,
    imageUrl: scene.imageUrl,
    audioUrl: scene.audioUrl,
    order: scene.order,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json()) as { order?: string[] };
  const order = body.order;

  if (!Array.isArray(order) || order.length === 0) {
    return new NextResponse("order must be a non-empty array of scene ids", {
      status: 400,
    });
  }
  if (new Set(order).size !== order.length) {
    return new NextResponse("order contains duplicate scene ids", { status: 400 });
  }

  const [story] = await db
    .select()
    .from(stories)
    .where(
      and(eq(stories.id, id), eq(stories.creatorId, session.user.id))
    );
  if (!story) return new NextResponse("Not found", { status: 404 });

  const existing = await db
    .select({ id: scenes.id })
    .from(scenes)
    .where(eq(scenes.storyId, story.id));
  const existingIds = new Set(existing.map((s) => s.id));

  if (order.length !== existingIds.size) {
    return new NextResponse("order length does not match scene count", {
      status: 400,
    });
  }
  for (const sceneId of order) {
    if (!existingIds.has(sceneId)) {
      return new NextResponse("order references unknown scene", { status: 400 });
    }
  }

  await Promise.all(
    order.map((sceneId, i) =>
      db.update(scenes).set({ order: i }).where(eq(scenes.id, sceneId))
    )
  );

  return NextResponse.json({ ok: true });
}
