import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignments, stories, users } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { StarRow } from "@/components/StarRow";
import { Leaderboard } from "@/components/Leaderboard";

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

  const leaderboardRaw = await db
    .select({
      studentId: users.id,
      name: users.name,
      stars: sql<number>`coalesce(sum(${assignments.rating}), 0)`.as("stars"),
    })
    .from(users)
    .leftJoin(assignments, eq(assignments.studentId, users.id))
    .where(eq(users.role, "student"))
    .groupBy(users.id, users.name)
    .having(
      sql`coalesce(sum(${assignments.rating}), 0) > 0 or ${users.id} = ${session!.user.id}`,
    )
    .orderBy(desc(sql`stars`), users.name);
  const leaderboard = leaderboardRaw.map((r) => ({
    ...r,
    stars: Number(r.stars) || 0,
  }));

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
          <div className="mt-4">
            <Leaderboard rows={leaderboard} meId={session!.user.id} />
          </div>
        </div>
      </aside>

      <div className="space-y-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight text-ink-900">
              Your stories
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Tap a story to listen, read, and record yourself.
            </p>
          </div>
          <Link href="/student/guide" className="btn-secondary shrink-0">
            <span aria-hidden>?</span>
            <span className="hidden sm:inline"> How it works</span>
          </Link>
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
