import { db } from "@/lib/db";
import { assignments, users } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { Leaderboard } from "@/components/Leaderboard";

export const dynamic = "force-dynamic";

export default async function TeacherLeaderboardPage() {
  const rows = await db
    .select({
      studentId: users.id,
      name: users.name,
      stars: sql<number>`coalesce(sum(${assignments.rating}), 0)`.as("stars"),
    })
    .from(users)
    .leftJoin(assignments, eq(assignments.studentId, users.id))
    .where(eq(users.role, "student"))
    .groupBy(users.id, users.name)
    .having(sql`coalesce(sum(${assignments.rating}), 0) > 0`)
    .orderBy(desc(sql`stars`), users.name);

  const board = rows.map((r) => ({ ...r, stars: Number(r.stars) || 0 }));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl tracking-tight text-ink-900">
            Leaderboard
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Ranked by total stars across all assignments. Students with 0 stars
            are hidden.
          </p>
        </div>
        <span className="badge">{board.length} ranked</span>
      </div>

      <div className="card max-w-xl">
        <Leaderboard rows={board} emptyLabel="No students have earned stars yet." />
      </div>
    </div>
  );
}
