import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignments, stories } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StudentHomePage() {
  const session = await auth();
  const rows = await db
    .select({
      id: assignments.id,
      storyId: stories.id,
      title: stories.title,
      description: stories.description,
      language: stories.language,
      createdAt: assignments.createdAt,
    })
    .from(assignments)
    .innerJoin(stories, eq(stories.id, assignments.storyId))
    .where(eq(assignments.studentId, session!.user.id))
    .orderBy(desc(assignments.createdAt));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Your assigned stories</h1>
      {rows.length === 0 ? (
        <p className="mt-4 text-slate-500">Nothing assigned yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {rows.map((a) => (
            <li key={a.id} className="rounded-xl border bg-white p-4">
              <Link
                href={`/student/story/${a.storyId}`}
                className="font-medium hover:underline"
              >
                {a.title}
              </Link>
              <div className="mt-1 text-xs text-slate-500">{a.language}</div>
              <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                {a.description}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
