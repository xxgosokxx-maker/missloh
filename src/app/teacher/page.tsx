import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories, users, assignments } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { DeleteStoryButton } from "@/components/DeleteStoryButton";
import { RenameStoryButton } from "@/components/RenameStoryButton";
import { RemixStoryButton } from "@/components/RemixStoryButton";
import { AssignStoryToStudentForm } from "@/components/AssignStoryToStudentForm";
import { ClickBarrier } from "@/components/ClickBarrier";
import { displayName } from "@/lib/names";

export const dynamic = "force-dynamic";

export default async function TeacherStoriesPage() {
  const session = await auth();
  const myStories = await db
    .select()
    .from(stories)
    .where(eq(stories.creatorId, session!.user.id))
    .orderBy(asc(stories.language), asc(stories.difficulty));

  const studentRows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, "student"));

  const students = studentRows.map((s) => ({
    id: s.id,
    name: displayName(s.name),
  }));

  const myAssignments = await db
    .select({
      studentId: assignments.studentId,
      storyId: assignments.storyId,
    })
    .from(assignments)
    .where(eq(assignments.assignedBy, session!.user.id));

  const assignedByStory = new Map<string, string[]>();
  for (const a of myAssignments) {
    const list = assignedByStory.get(a.storyId) ?? [];
    list.push(a.studentId);
    assignedByStory.set(a.storyId, list);
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl tracking-tight text-ink-900">
              Your stories
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {myStories.length} total
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/teacher/stories/new" className="btn-primary">
              Generate a new story →
            </Link>
            <Link
              href="/teacher/stories/upload"
              className="rounded-2xl border border-ink-200 bg-white/80 px-4 py-2 text-sm font-medium text-ink-700 shadow-soft transition hover:bg-white hover:text-brand-600"
            >
              Upload your own story →
            </Link>
          </div>
        </div>

        {myStories.length === 0 ? (
          <div className="card text-center text-ink-500">
            No stories yet. Generate or upload your first one above.
          </div>
        ) : (
          <ul className="space-y-2">
            {myStories.map((s) => {
              const assigned = assignedByStory.get(s.id) ?? [];
              return (
                <li key={s.id}>
                  <details className="group card !p-0 overflow-hidden">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/teacher/stories/${s.id}`}
                          className="block truncate text-sm font-medium text-ink-900 transition hover:text-brand-600"
                        >
                          {s.title}
                        </Link>
                        <div className="mt-0.5 text-[11px] text-ink-500">
                          {s.language} · Lv {s.difficulty} · {s.imageStyle}
                        </div>
                      </div>
                      <span className="badge shrink-0">
                        {assigned.length} assigned
                      </span>
                      <ClickBarrier>
                        <RenameStoryButton id={s.id} currentTitle={s.title} />
                        <DeleteStoryButton id={s.id} />
                      </ClickBarrier>
                      <svg
                        className="h-4 w-4 shrink-0 text-ink-400 transition group-open:rotate-180"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </summary>
                    <div className="space-y-3 border-t border-ink-100 px-4 py-3">
                      <AssignStoryToStudentForm
                        storyId={s.id}
                        students={students}
                        assignedStudentIds={assigned}
                      />
                      <div className="border-t border-ink-100 pt-3">
                        <RemixStoryButton
                          storyId={s.id}
                          originalTitle={s.title}
                        />
                      </div>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
