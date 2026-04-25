import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories, scenes, users, assignments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { DeleteStoryButton } from "@/components/DeleteStoryButton";
import { RenameStoryButton } from "@/components/RenameStoryButton";
import { RemixStoryButton } from "@/components/RemixStoryButton";
import { ArchiveStoryButton } from "@/components/ArchiveStoryButton";
import { AssignStoryToStudentForm } from "@/components/AssignStoryToStudentForm";
import { Chevron } from "@/components/Chevron";
import { LanguageTabs } from "@/components/LanguageTabs";
import { NewStoryButton } from "@/components/NewStoryButton";
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
  if (v === "least-assigned" || v === "newest" || v === "title") return v;
  return "difficulty";
}

function parseQ(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return (v ?? "").trim();
}

export default async function TeacherStoriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    archived?: string;
    q?: string;
    lang?: string;
  }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const sort = parseSort(sp.sort);
  const showArchived = sp.archived === "1";
  const query = parseQ(sp.q);
  const queryLower = query.toLowerCase();
  const requestedLang = parseQ(sp.lang);

  const [allStories, studentRows, myAssignments, thumbRows] = await Promise.all([
    db
      .select()
      .from(stories)
      .where(eq(stories.creatorId, session!.user.id)),
    db
      .select({ id: users.id, name: users.name, tag: users.tag })
      .from(users)
      .where(eq(users.role, "student")),
    db
      .select({
        studentId: assignments.studentId,
        storyId: assignments.storyId,
      })
      .from(assignments)
      .where(eq(assignments.assignedBy, session!.user.id)),
    db
      .select({ storyId: scenes.storyId, imageUrl: scenes.imageUrl })
      .from(scenes)
      .innerJoin(stories, eq(scenes.storyId, stories.id))
      .where(
        and(eq(scenes.order, 0), eq(stories.creatorId, session!.user.id))
      ),
  ]);

  const studentsByTag = new Map<string, { id: string; name: string }[]>();
  for (const s of studentRows) {
    if (!s.tag) continue;
    const list = studentsByTag.get(s.tag) ?? [];
    list.push({ id: s.id, name: displayName(s.name) });
    studentsByTag.set(s.tag, list);
  }

  const assignedByStory = new Map<string, string[]>();
  for (const a of myAssignments) {
    const list = assignedByStory.get(a.storyId) ?? [];
    list.push(a.studentId);
    assignedByStory.set(a.storyId, list);
  }
  const countOf = (s: Story) => assignedByStory.get(s.id)?.length ?? 0;

  const thumbByStory = new Map<string, string | null>();
  for (const t of thumbRows) thumbByStory.set(t.storyId, t.imageUrl);

  const matchesQuery = (s: Story) =>
    queryLower.length === 0 ||
    s.title.toLowerCase().includes(queryLower);

  const filtered = allStories.filter(matchesQuery);
  const active = filtered.filter((s) => !s.archivedAt);
  const archived = filtered.filter((s) => !!s.archivedAt);
  const unassignedCount = active.filter((s) => countOf(s) === 0).length;
  const totalActive = allStories.filter((s) => !s.archivedAt).length;
  const totalArchived = allStories.length - totalActive;

  function sortStories(list: Story[]): Story[] {
    return [...list].sort((a, b) => {
      if (sort === "newest") return b.createdAt.getTime() - a.createdAt.getTime();
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "least-assigned")
        return countOf(a) - countOf(b) || a.title.localeCompare(b.title);
      return a.difficulty - b.difficulty || a.title.localeCompare(b.title);
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

  const allLanguages = Array.from(
    new Set(allStories.filter((s) => !s.archivedAt).map((s) => s.language))
  ).sort((a, b) => a.localeCompare(b));

  const tabs = allLanguages.map((language) => ({
    language,
    count: activeByLanguage.get(language)?.length ?? 0,
  }));

  const biggestLang = [...tabs].sort((a, b) => b.count - a.count)[0]?.language;
  const fallbackLang = biggestLang ?? allLanguages[0] ?? "";
  const activeLang = allLanguages.includes(requestedLang)
    ? requestedLang
    : fallbackLang;

  const visibleStories = activeByLanguage.get(activeLang) ?? [];
  const visibleArchived = archived.filter((s) => s.language === activeLang);

  const noStoriesAtAll = allStories.length === 0;
  const noMatches = !noStoriesAtAll && filtered.length === 0;

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl tracking-tight text-ink-900">
              Your stories
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              <span className="font-medium text-ink-700">{totalActive}</span>{" "}
              active
              {totalArchived > 0 && <> · {totalArchived} archived</>}
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
          <NewStoryButton />
        </div>

        {!noStoriesAtAll && tabs.length >= 2 && (
          <div className="mb-3">
            <LanguageTabs tabs={tabs} active={activeLang} />
          </div>
        )}

        {!noStoriesAtAll && (
          <div className="mb-4">
            <StoryLibraryToolbar
              sort={sort}
              showArchived={showArchived}
              query={query}
            />
          </div>
        )}

        {noStoriesAtAll ? (
          <div className="card text-center text-ink-500">
            No stories yet. Generate or upload your first one above.
          </div>
        ) : noMatches ? (
          <div className="card text-center text-ink-500">
            No stories match &ldquo;{query}&rdquo;.
          </div>
        ) : (
          <div className="space-y-4">
            {visibleStories.length === 0 ? (
              <div className="card text-center text-ink-500">
                {query.length > 0
                  ? `No ${activeLang} stories match “${query}”.`
                  : `No ${activeLang} stories yet.`}
              </div>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {visibleStories.map((s) => (
                  <StoryCard
                    key={s.id}
                    story={s}
                    assigned={assignedByStory.get(s.id) ?? []}
                    students={studentsByTag.get(s.language) ?? []}
                    thumbUrl={thumbByStory.get(s.id) ?? null}
                  />
                ))}
              </ul>
            )}

            {showArchived && visibleArchived.length > 0 && (
              <details className="group rounded-3xl border border-ink-100 bg-ink-50/60 backdrop-blur-sm">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
                  <Chevron className="group-open:rotate-180" />
                  <span className="font-display text-lg tracking-tight text-ink-700">
                    Archived {activeLang}
                  </span>
                  <span className="badge">{visibleArchived.length}</span>
                </summary>
                <ul className="grid gap-2 border-t border-ink-100 px-3 py-3 sm:grid-cols-2">
                  {sortStories(visibleArchived).map((s) => (
                    <StoryCard
                      key={s.id}
                      story={s}
                      assigned={assignedByStory.get(s.id) ?? []}
                      students={studentsByTag.get(s.language) ?? []}
                      thumbUrl={thumbByStory.get(s.id) ?? null}
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
  thumbUrl,
}: {
  story: Story;
  assigned: string[];
  students: { id: string; name: string }[];
  thumbUrl: string | null;
}) {
  const isArchived = !!story.archivedAt;
  const isUnassigned = assigned.length === 0 && !isArchived;

  return (
    <li>
      <div className="card !p-3">
        <div className="flex items-start gap-3">
          <Link
            href={`/teacher/stories/${story.id}`}
            className="block h-14 w-14 flex-none overflow-hidden rounded-xl bg-ink-100 ring-1 ring-ink-100 transition hover:ring-brand-300"
            aria-label={`Open ${story.title}`}
          >
            {thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-[10px] uppercase tracking-wide text-ink-400">
                no img
              </div>
            )}
          </Link>
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
          <div className="flex flex-none flex-col items-end gap-1">
            <RenameStoryButton id={story.id} currentTitle={story.title} />
            <ArchiveStoryButton id={story.id} archived={isArchived} />
            <DeleteStoryButton id={story.id} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-3">
          <AssignStoryToStudentForm
            storyId={story.id}
            students={students}
            assignedStudentIds={assigned}
            emptyLabel={`No ${story.language} students yet`}
          />
          <RemixStoryButton storyId={story.id} originalTitle={story.title} />
        </div>
      </div>
    </li>
  );
}
