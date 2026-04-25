import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignments, stories } from "@/lib/db/schema";

const AUDIO_CONTENT_TYPES = [
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/ogg;codecs=opus",
];

const UPLOAD_IMAGE_CONTENT_TYPES = ["image/webp"];

// Pathnames the client is allowed to request upload tokens for.
// - recordings/<assignmentId>/...        -> student who owns that assignment
// - stories/voiceover/...                -> teacher
// - stories/upload/<tempId>/scene-N.webp -> teacher (teacher-provided scene images)
// - stories/<storyId>/added-<ts>.webp    -> teacher who owns the story (add-scene flow)
const RECORDING_RE = /^recordings\/([0-9a-f-]{36})\/[^/]+$/i;
const VOICEOVER_RE = /^stories\/voiceover\/[^/]+$/;
const UPLOAD_IMAGE_RE =
  /^stories\/upload\/[0-9a-f-]{36}\/scene-\d+\.webp$/i;
const ADD_SCENE_IMAGE_RE =
  /^stories\/([0-9a-f-]{36})\/added-\d+\.webp$/i;

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await auth();
        if (!session?.user) throw new Error("Unauthorized");

        const role = session.user.role;
        const recMatch = pathname.match(RECORDING_RE);
        const voMatch = VOICEOVER_RE.test(pathname);
        const upImgMatch = UPLOAD_IMAGE_RE.test(pathname);
        const addSceneMatch = pathname.match(ADD_SCENE_IMAGE_RE);

        let allowedContentTypes = AUDIO_CONTENT_TYPES;

        if (recMatch) {
          if (role !== "student") throw new Error("Forbidden");
          const assignmentId = recMatch[1];
          const [assignment] = await db
            .select({ id: assignments.id })
            .from(assignments)
            .where(
              and(
                eq(assignments.id, assignmentId),
                eq(assignments.studentId, session.user.id)
              )
            );
          if (!assignment) throw new Error("Forbidden");
        } else if (voMatch) {
          if (role !== "teacher") throw new Error("Forbidden");
        } else if (upImgMatch) {
          if (role !== "teacher") throw new Error("Forbidden");
          allowedContentTypes = UPLOAD_IMAGE_CONTENT_TYPES;
        } else if (addSceneMatch) {
          if (role !== "teacher") throw new Error("Forbidden");
          const storyId = addSceneMatch[1];
          const [story] = await db
            .select({ id: stories.id })
            .from(stories)
            .where(
              and(
                eq(stories.id, storyId),
                eq(stories.creatorId, session.user.id)
              )
            );
          if (!story) throw new Error("Forbidden");
          allowedContentTypes = UPLOAD_IMAGE_CONTENT_TYPES;
        } else {
          throw new Error("Forbidden pathname");
        }

        return {
          allowedContentTypes,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      onUploadCompleted: async () => {
        // no-op; DB row is written by /api/recordings or /api/scenes/[id]
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
