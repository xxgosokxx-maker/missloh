import { db } from "@/lib/db";
import { assignments, users } from "@/lib/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { Leaderboard } from "@/components/Leaderboard";

export const dynamic = "force-dynamic";

async function boardFor(tag: "French" | "Mandarin") {
  const rows = await db
    .select({
      studentId: users.id,
      name: users.name,
      stars: sql<number>`coalesce(sum(${assignments.rating}), 0)`.as("stars"),
    })
    .from(users)
    .leftJoin(assignments, eq(assignments.studentId, users.id))
    .where(and(eq(users.role, "student"), eq(users.tag, tag)))
    .groupBy(users.id, users.name)
    .orderBy(desc(sql`stars`), users.name);
  return rows.map((r) => ({ ...r, stars: Number(r.stars) || 0 }));
}

export default async function TeacherLeaderboardPage() {
  const [french, mandarin] = await Promise.all([
    boardFor("French"),
    boardFor("Mandarin"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl tracking-tight text-ink-900">
          Leaderboard
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Ranked by total stars across all assignments. Tag a student on the
          Students page to include them in a board.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BoardCard title="French" count={french.length}>
          <Leaderboard
            rows={french}
            emptyLabel="No students tagged French yet."
          />
        </BoardCard>
        <BoardCard title="Mandarin" count={mandarin.length}>
          <Leaderboard
            rows={mandarin}
            emptyLabel="No students tagged Mandarin yet."
          />
        </BoardCard>
      </div>
    </div>
  );
}

function BoardCard({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-xl tracking-tight text-ink-900">
          {title}
        </h3>
        <span className="badge">{count} ranked</span>
      </div>
      {children}
    </div>
  );
}
