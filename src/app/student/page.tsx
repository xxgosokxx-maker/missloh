import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignments, stories, users } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { displayName } from "@/lib/names";
import { StarRow } from "@/components/StarRow";

export const dynamic = "force-dynamic";

export default async function StudentHomePage() {
  const session = await auth();

  const rows = await db
    .select({
      id: assignments.id,
      storyId: stories.id,
      title: stories.title,
      description: stories.description,
      rating: assignments.rating,
      createdAt: assignments.createdAt,
    })
    .from(assignments)
    .innerJoin(stories, eq(stories.id, assignments.storyId))
    .where(eq(assignments.studentId, session!.user.id))
    .orderBy(desc(assignments.createdAt));

  const leaderboard = await db
    .select({
      studentId: users.id,
      name: users.name,
      stars: sql<number>`coalesce(sum(${assignments.rating}), 0)`.as("stars"),
    })
    .from(users)
    .leftJoin(assignments, eq(assignments.studentId, users.id))
    .where(eq(users.role, "student"))
    .groupBy(users.id, users.name)
    .orderBy(desc(sql`stars`), users.name);

  return (
    <div className="grid gap-8 md:grid-cols-[260px_1fr]">
      <aside className="space-y-4 md:sticky md:top-24 md:self-start">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg tracking-tight text-ink-900">
              Leaderboard
            </h2>
            <span className="text-accent-500" aria-hidden>
              ★
            </span>
          </div>
          {leaderboard.length === 0 ? (
            <p className="mt-3 text-xs text-ink-500">No stars yet.</p>
          ) : (
            <ol className="mt-4 space-y-2">
              {leaderboard.map((row, i) => {
                const isMe = row.studentId === session!.user.id;
                const stars = Number(row.stars) || 0;
                return (
                  <li
                    key={row.studentId}
                    className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition ${
                      isMe
                        ? "bg-gradient-to-br from-brand-50 to-accent-50 ring-1 ring-brand-200"
                        : "hover:bg-ink-50"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`grid h-6 w-6 flex-none place-items-center rounded-full text-[11px] font-semibold ${
                          i === 0
                            ? "bg-accent-400 text-ink-900"
                            : i === 1
                              ? "bg-ink-200 text-ink-800"
                              : i === 2
                                ? "bg-brand-200 text-brand-800"
                                : "bg-ink-100 text-ink-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`truncate ${
                          isMe ? "font-semibold text-ink-900" : "text-ink-700"
                        }`}
                      >
                        {displayName(row.name)}
                      </span>
                    </div>
                    <span className="flex flex-none items-center gap-1 text-xs font-medium text-ink-700 tabular-nums">
                      {stars}
                      <span className="text-accent-500" aria-hidden>
                        ★
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </aside>

      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-ink-900">
            Your stories
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Tap a story to listen, read, and record yourself.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="card text-center text-ink-500">
            Nothing assigned yet. Check back soon.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {rows.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/student/story/${a.storyId}`}
                  className="card block h-full transition hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-display text-xl leading-tight tracking-tight text-ink-900">
                      {a.title}
                    </div>
                    <span aria-hidden className="text-brand-500">
                      →
                    </span>
                  </div>
                  {a.rating ? (
                    <div className="mt-3">
                      <StarRow value={a.rating} />
                    </div>
                  ) : null}
                  <p className="mt-3 line-clamp-3 text-sm text-ink-600">
                    {a.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
