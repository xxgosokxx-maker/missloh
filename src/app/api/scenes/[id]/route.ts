import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scenes, stories } from "@/lib/db/schema";
import { generateSceneAudio, type VoiceGender } from "@/lib/ai";
import { isOwnBlobUrl } from "@/lib/blob";

export async function PATCH(
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
    audioUrl?: string;
    regenerateAudio?: boolean;
  };
  const newSubtitle = body.subtitle?.trim();
  const providedAudioUrl = body.audioUrl?.trim();
  const regenerateAudio = body.regenerateAudio ?? true;

  if (!newSubtitle && !providedAudioUrl) {
    return new NextResponse("subtitle or audioUrl required", { status: 400 });
  }
  if (providedAudioUrl && !isOwnBlobUrl(providedAudioUrl)) {
    return new NextResponse("Invalid audioUrl", { status: 400 });
  }

  const [row] = await db
    .select({ scene: scenes, story: stories })
    .from(scenes)
    .innerJoin(stories, eq(scenes.storyId, stories.id))
    .where(
      and(eq(scenes.id, id), eq(stories.creatorId, session.user.id))
    );
  if (!row) return new NextResponse("Not found", { status: 404 });

  const update: { subtitle?: string; audioUrl?: string } = {};
  if (newSubtitle && newSubtitle !== row.scene.subtitle) {
    update.subtitle = newSubtitle;
    if (regenerateAudio) {
      const pathname = `stories/${row.story.id}/${row.scene.id}-${Date.now()}.wav`;
      update.audioUrl = await generateSceneAudio(
        newSubtitle,
        pathname,
        row.story.language,
        row.story.voice as VoiceGender
      );
    }
  }
  if (providedAudioUrl) {
    update.audioUrl = providedAudioUrl;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({
      subtitle: row.scene.subtitle,
      audioUrl: row.scene.audioUrl,
    });
  }

  await db.update(scenes).set(update).where(eq(scenes.id, id));

  return NextResponse.json({
    subtitle: update.subtitle ?? row.scene.subtitle,
    audioUrl: update.audioUrl ?? row.scene.audioUrl,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const [row] = await db
    .select({ scene: scenes, story: stories })
    .from(scenes)
    .innerJoin(stories, eq(scenes.storyId, stories.id))
    .where(
      and(eq(scenes.id, id), eq(stories.creatorId, session.user.id))
    );
  if (!row) return new NextResponse("Not found", { status: 404 });

  await db.delete(scenes).where(eq(scenes.id, id));

  const remaining = await db
    .select({ id: scenes.id, order: scenes.order })
    .from(scenes)
    .where(eq(scenes.storyId, row.story.id))
    .orderBy(asc(scenes.order));

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].order !== i) {
      await db.update(scenes).set({ order: i }).where(eq(scenes.id, remaining[i].id));
    }
  }

  return NextResponse.json({ ok: true });
}
