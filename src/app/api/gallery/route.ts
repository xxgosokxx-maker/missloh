import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scenes, stories } from "@/lib/db/schema";
import { and, asc, eq, isNotNull, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Remixes reuse the source story's imageUrl verbatim, so collapsing by
// imageUrl and keeping the oldest story per URL yields only originals.
export async function GET() {
  const originals = db
    .selectDistinctOn([scenes.imageUrl], {
      url: scenes.imageUrl,
      subtitle: scenes.subtitle,
    })
    .from(scenes)
    .innerJoin(stories, eq(stories.id, scenes.storyId))
    .where(and(eq(scenes.order, 0), isNotNull(scenes.imageUrl)))
    .orderBy(scenes.imageUrl, asc(stories.createdAt))
    .as("originals");

  const rows = await db
    .select()
    .from(originals)
    .orderBy(sql`random()`)
    .limit(4);

  return NextResponse.json(rows, {
    headers: { "Cache-Control": "no-store" },
  });
}
