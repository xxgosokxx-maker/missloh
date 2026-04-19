import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { StoryGenerator } from "@/components/StoryGenerator";
import { DeleteStoryButton } from "@/components/DeleteStoryButton";
import { RenameStoryButton } from "@/components/RenameStoryButton";
import { RemixStoryButton } from "@/components/RemixStoryButton";

export const dynamic = "force-dynamic";

export default async function TeacherStoriesPage() {
  const session = await auth();
  const myStories = await db
    .select()
    .from(stories)
    .where(eq(stories.creatorId, session!.user.id))
    .orderBy(desc(stories.createdAt));

  return (
    <div className="space-y-12">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl tracking-tight text-ink-900">
              Generate a new story
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Pick a language, art style, and difficulty. We'll draft scenes,
              illustrate them, and narrate them in a natural voice.
            </p>
          </div>
        </div>
        <StoryGenerator />
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-display text-3xl tracking-tight text-ink-900">
            Your stories
          </h2>
          <span className="badge">{myStories.length} total</span>
        </div>
        {myStories.length === 0 ? (
          <div className="card text-center text-ink-500">
            No stories yet. Generate your first one above.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {myStories.map((s) => (
              <li key={s.id} className="card flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/teacher/stories/${s.id}`}
                      className="block font-display text-xl leading-tight tracking-tight text-ink-900 transition hover:text-brand-600"
                    >
                      {s.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="badge">{s.language}</span>
                      <span className="badge">Lv {s.difficulty}</span>
                      <span className="badge">{s.imageStyle}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <RenameStoryButton id={s.id} currentTitle={s.title} />
                    <DeleteStoryButton id={s.id} />
                  </div>
                </div>
                <div className="border-t border-ink-100 pt-4">
                  <RemixStoryButton storyId={s.id} originalTitle={s.title} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
