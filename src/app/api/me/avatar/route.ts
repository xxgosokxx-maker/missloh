import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isKnownAvatarUrl } from "@/lib/avatars";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (session.user.role !== "student") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { url?: unknown }
    | null;
  if (!body || (body.url !== null && !isKnownAvatarUrl(body.url))) {
    return new NextResponse("Invalid avatar", { status: 400 });
  }

  await db
    .update(users)
    .set({ avatarUrl: body.url ?? null })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true });
}
