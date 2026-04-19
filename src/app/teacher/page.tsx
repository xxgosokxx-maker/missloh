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
import { Chevron } from "@/components/Chevron";
import { Pill } from "@/components/Pill";
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
  searchParams: Promise<{ sort?: string; archived?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const sort = parseSort(sp.sort);
  const showArchived = sp.archived === "1";

  const [allStories, studentRows, myAssignments] = await Promise.all([
    db
      .select()
      .from(stories)
      .where(eq(stories.creatorId, session!.user.id)),
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.role, "student")),
    db
      .select({
        studentId: assignments.studentId,
        storyId: assignments.storyId,
      })
      .from(assignments)
      .where(eq(assignments.assignedBy, session!.user.id)),
  ]);

  const students = studentRows.map((s) => ({
    id: s.id,
    name: displayName(s.name),
  }));

  const assignedByStory = new Map<string, string[]>();
  for (const a of myAssignments) {
    const list = assignedByStory.get(a.storyId) ?? [];
    list.push(a.studentId);
    assignedByStory.set(a.storyId, list);
  }
  const countOf = (s: Story) => assignedByStory.get(s.id)?.length ?? 0;

  const active = allStories.filter((s) => !s.archivedAt);
  const archived = allStories.filter((s) => !!s.archivedAt);
  const unassignedCount = active.filter((s) => countOf(s) === 0).length;

  function sortStories(list: Story[]): Story[] {
    return [...list].sort((a, b) => {
      if (sort === "newest") return b.createdAt.getTime() - a.createdAt.getTime();
      if (sort === "least-assigned")
        return countOf(a) - countOf(b) || a.difficulty - b.difficulty;
      return a.difficulty - b.difficulty;
    });
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
  const biggestLang = [...languageGroups].sort(
    ([, a], [, b]) => b.length - a.length
  )[0]?.[0];
  const defaultOpenLang = new Set(
    languageGroups.length < 3
      ? languageGroups.map(([l]) => l)
      : biggestLang
        ? [biggestLang]
        : []
  );

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
              {archived.length > 0 && <> · {archived.length} archived</>}
              {unassignedCount > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <span className="text-amber-700">
                    {unassignedCount} unassigned
                  </span>
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
              const groupUnassigned = list.filter((s) => countOf(s) === 0).length;
              return (
                <details
                  key={language}
                  open={defaultOpenLang.has(language)}
                  className="group rounded-3xl border border-ink-100 bg-white/60 backdrop-blur-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
                    <Chevron className="group-open:rotate-180" />
                    <span className="font-display text-lg tracking-tight text-ink-900">
                      {language}
                    </span>
                    <span className="badge">{list.length}</span>
                    {groupUnassigned > 0 && (
                      <Pill tone="amber">{groupUnassigned} unassigned</Pill>
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
                  <Chevron className="group-open:rotate-180" />
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
                <Pill tone="amber" size="xs">
                  Unassigned
                </Pill>
              )}
              {assigned.length > 0 && (
                <Pill size="xs">{assigned.length} assigned</Pill>
              )}
            </div>
          </div>
          <ClickBarrier>
            <RenameStoryButton id={story.id} currentTitle={story.title} />
            <ArchiveStoryButton id={story.id} archived={isArchived} />
            <DeleteStoryButton id={story.id} />
          </ClickBarrier>
          <Chevron className="group-open/card:rotate-180" />
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
