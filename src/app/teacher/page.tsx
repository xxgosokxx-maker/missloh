import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories, users, assignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { DeleteStoryButton } from "@/components/DeleteStoryButton";
import { RenameStoryButton } from "@/components/RenameStoryButton";
import { RemixStoryButton } from "@/components/RemixStoryButton";
import { ArchiveStoryButton } from "@/components/ArchiveStoryButton";
import { AssignStoryToStudentForm } from "@/components/AssignStoryToStudentForm";
import { ClickBarrier } from "@/components/ClickBarrier";
import {
  StoryLibraryToolbar,
  type SortKey,
} from "@/components/StoryLibraryToolbar";
import { displayName } from "@/lib/names";

export const dynamic = "force-dynamic";

type Story = typeof stories.$inferSelect;

function parseSort(value: string | string[] | undefined): SortKey {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === "least-assigned" || v === "newest") return v;
  return "difficulty";
}

export default async function TeacherStoriesPage({
  searchParams,
}: {
  searchParams: { sort?: string; archived?: string };
}) {
  const session = await auth();
  const sort = parseSort(searchParams.sort);
  const showArchived = searchParams.archived === "1";

  const allStories = await db
    .select()
    .from(stories)
    .where(eq(stories.creatorId, session!.user.id));

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

  const active = allStories.filter((s) => !s.archivedAt);
  const archived = allStories.filter((s) => !!s.archivedAt);
  const unassignedCount = active.filter(
    (s) => (assignedByStory.get(s.id)?.length ?? 0) === 0
  ).length;

  function sortStories(list: Story[]): Story[] {
    const withCounts = list.map((s) => ({
      s,
      count: assignedByStory.get(s.id)?.length ?? 0,
    }));
    if (sort === "least-assigned") {
      withCounts.sort(
        (a, b) => a.count - b.count || a.s.difficulty - b.s.difficulty
      );
    } else if (sort === "newest") {
      withCounts.sort(
        (a, b) => b.s.createdAt.getTime() - a.s.createdAt.getTime()
      );
    } else {
      withCounts.sort((a, b) => a.s.difficulty - b.s.difficulty);
    }
    return withCounts.map((x) => x.s);
  }

  const activeByLanguage = new Map<string, Story[]>();
  for (const s of active) {
    const list = activeByLanguage.get(s.language) ?? [];
    list.push(s);
    activeByLanguage.set(s.language, list);
  }
  for (const [lang, list] of activeByLanguage) {
    activeByLanguage.set(lang, sortStories(list));
  }

  const languageGroups = Array.from(activeByLanguage.entries()).sort(
    ([a], [b]) => a.localeCompare(b)
  );
  const defaultOpenLang =
    languageGroups.length < 3
      ? new Set(languageGroups.map(([l]) => l))
      : new Set([
          languageGroups
            .slice()
            .sort(([, a], [, b]) => b.length - a.length)[0]?.[0] ?? "",
        ]);

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl tracking-tight text-ink-900">
              Your stories
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              <span className="font-medium text-ink-700">{active.length}</span>{" "}
              active
              {archived.length > 0 && (
                <>
                  {" "}
                  · {archived.length} archived
                </>
              )}
              {unassignedCount > 0 && (
                <>
                  {" "}
                  · <span className="text-amber-700">{unassignedCount} unassigned</span>
                </>
              )}
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

        {allStories.length > 0 && (
          <div className="mb-4">
            <StoryLibraryToolbar sort={sort} showArchived={showArchived} />
          </div>
        )}

        {allStories.length === 0 ? (
          <div className="card text-center text-ink-500">
            No stories yet. Generate or upload your first one above.
          </div>
        ) : (
          <div className="space-y-4">
            {languageGroups.map(([language, list]) => {
              const groupUnassigned = list.filter(
                (s) => (assignedByStory.get(s.id)?.length ?? 0) === 0
              ).length;
              return (
                <details
                  key={language}
                  open={defaultOpenLang.has(language)}
                  className="group rounded-3xl border border-ink-100 bg-white/60 backdrop-blur-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
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
                    <span className="font-display text-lg tracking-tight text-ink-900">
                      {language}
                    </span>
                    <span className="badge">{list.length}</span>
                    {groupUnassigned > 0 && (
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-amber-700">
                        {groupUnassigned} unassigned
                      </span>
                    )}
                  </summary>
                  <ul className="grid gap-2 border-t border-ink-100 px-3 py-3 sm:grid-cols-2">
                    {list.map((s) => (
                      <StoryCard
                        key={s.id}
                        story={s}
                        assigned={assignedByStory.get(s.id) ?? []}
                        students={students}
                      />
                    ))}
                  </ul>
                </details>
              );
            })}

            {showArchived && archived.length > 0 && (
              <details className="group rounded-3xl border border-ink-100 bg-ink-50/60 backdrop-blur-sm">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
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
                  <span className="font-display text-lg tracking-tight text-ink-700">
                    Archived
                  </span>
                  <span className="badge">{archived.length}</span>
                </summary>
                <ul className="grid gap-2 border-t border-ink-100 px-3 py-3 sm:grid-cols-2">
                  {sortStories(archived).map((s) => (
                    <StoryCard
                      key={s.id}
                      story={s}
                      assigned={assignedByStory.get(s.id) ?? []}
                      students={students}
                    />
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function StoryCard({
  story,
  assigned,
  students,
}: {
  story: Story;
  assigned: string[];
  students: { id: string; name: string }[];
}) {
  const isArchived = !!story.archivedAt;
  const isUnassigned = assigned.length === 0 && !isArchived;

  return (
    <li>
      <details className="group/card card !p-0 overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1">
            <Link
              href={`/teacher/stories/${story.id}`}
              className="block truncate text-sm font-medium text-ink-900 transition hover:text-brand-600"
            >
              {story.title}
            </Link>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-500">
              <span>Lv {story.difficulty}</span>
              <span>·</span>
              <span className="truncate">{story.imageStyle}</span>
              {isUnassigned && (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                  Unassigned
                </span>
              )}
              {assigned.length > 0 && (
                <span className="inline-flex items-center rounded-full border border-ink-200 bg-white/80 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide text-ink-600">
                  {assigned.length} assigned
                </span>
              )}
            </div>
          </div>
          <ClickBarrier>
            <RenameStoryButton id={story.id} currentTitle={story.title} />
            <ArchiveStoryButton id={story.id} archived={isArchived} />
            <DeleteStoryButton id={story.id} />
          </ClickBarrier>
          <svg
            className="h-4 w-4 shrink-0 text-ink-400 transition group-open/card:rotate-180"
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
        <div className="space-y-3 border-t border-ink-100 px-3 py-3">
          <AssignStoryToStudentForm
            storyId={story.id}
            students={students}
            assignedStudentIds={assigned}
          />
          <div className="border-t border-ink-100 pt-3">
            <RemixStoryButton storyId={story.id} originalTitle={story.title} />
          </div>
        </div>
      </details>
    </li>
  );
}
