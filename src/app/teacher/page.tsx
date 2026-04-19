import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { StoryGenerator } from "@/components/StoryGenerator";
import { DeleteStoryButton } from "@/components/DeleteStoryButton";

export const dynamic = "force-dynamic";

export default async function TeacherStoriesPage() {
  const session = await auth();
  const myStories = await db
    .select()
    .from(stories)
    .where(eq(stories.creatorId, session!.user.id))
    .orderBy(desc(stories.createdAt));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section>
        <h2 className="text-xl font-semibold">Generate a new story</h2>
        <StoryGenerator />
      </section>

      <section>
        <h2 className="text-xl font-semibold">Your stories</h2>
        {myStories.length === 0 ? (
          <p className="mt-4 text-slate-500">No stories yet.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {myStories.map((s) => (
              <li
                key={s.id}
                className="flex items-start justify-between gap-4 rounded-xl border bg-white p-4"
              >
                <div>
                  <Link
                    href={`/teacher/stories/${s.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {s.title}
                  </Link>
                  <div className="mt-1 text-xs text-slate-500">
                    {s.language} · difficulty {s.difficulty} · {s.imageStyle}
                  </div>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                    {s.description}
                  </p>
                </div>
                <DeleteStoryButton id={s.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
