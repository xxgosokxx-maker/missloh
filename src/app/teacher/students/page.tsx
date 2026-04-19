import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, assignments, stories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { AssignStoryForm } from "@/components/AssignStoryForm";
import { RemoveAssignmentButton } from "@/components/RemoveAssignmentButton";
import { StarRating } from "@/components/StarRating";
import { EditStudentNameButton } from "@/components/EditStudentNameButton";
import { CreateStudentButton } from "@/components/CreateStudentButton";
import { RegeneratePinButton } from "@/components/RegeneratePinButton";
import { DeleteStudentButton } from "@/components/DeleteStudentButton";
import { ClickBarrier } from "@/components/ClickBarrier";
import { displayName } from "@/lib/names";

export const dynamic = "force-dynamic";

export default async function TeacherStudentsPage() {
  const session = await auth();

  const students = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      authKind: users.authKind,
    })
    .from(users)
    .where(eq(users.role, "student"));

  const teacherStories = await db
    .select({
      id: stories.id,
      title: stories.title,
      language: stories.language,
      difficulty: stories.difficulty,
    })
    .from(stories)
    .where(eq(stories.creatorId, session!.user.id))
    .orderBy(desc(stories.createdAt));

  const myAssignments = await db
    .select({
      id: assignments.id,
      studentId: assignments.studentId,
      storyId: assignments.storyId,
      storyTitle: stories.title,
      language: stories.language,
      difficulty: stories.difficulty,
      rating: assignments.rating,
    })
    .from(assignments)
    .innerJoin(stories, eq(stories.id, assignments.storyId))
    .where(eq(assignments.assignedBy, session!.user.id));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-3xl tracking-tight text-ink-900">
          Students
        </h2>
        <div className="flex items-center gap-3">
          <span className="badge">{students.length} enrolled</span>
          <CreateStudentButton />
        </div>
      </div>

      {students.length === 0 && (
        <div className="card text-center text-ink-500">
          No students yet. Click <span className="font-medium">+ New student</span> to create one with a PIN, or ask them to sign in with Google.
        </div>
      )}

      <ul className="space-y-2">
        {students.map((student) => {
          const theirs = myAssignments.filter(
            (a) => a.studentId === student.id
          );
          const initial = student.name?.[0]?.toUpperCase() ?? "·";
          const shortName = displayName(student.name);
          return (
            <li key={student.id}>
              <details className="group card !p-0 overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent-300 to-brand-400 text-xs font-semibold text-white shadow-soft">
                    {initial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-900">
                      {shortName}
                    </div>
                    <div className="text-[11px] text-ink-500">
                      {student.authKind === "pin"
                        ? "PIN login"
                        : student.email}
                    </div>
                  </div>
                  <span className="badge shrink-0">
                    {theirs.length} assigned
                  </span>
                  <ClickBarrier>
                    <EditStudentNameButton
                      id={student.id}
                      currentName={student.name}
                    />
                    {student.authKind === "pin" && (
                      <RegeneratePinButton
                        studentId={student.id}
                        studentName={shortName}
                      />
                    )}
                    <DeleteStudentButton id={student.id} name={shortName} />
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
                  <AssignStoryForm
                    studentId={student.id}
                    stories={teacherStories}
                    assignedStoryIds={theirs.map((t) => t.storyId)}
                  />
                  {theirs.length > 0 && (
                    <ul className="divide-y divide-ink-100">
                      {theirs.map((a) => (
                        <li
                          key={a.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-2"
                        >
                          <Link
                            href={`/teacher/students/${student.id}/story/${a.storyId}`}
                            className="min-w-0 flex-1 truncate text-sm font-medium text-ink-800 transition hover:text-brand-600"
                          >
                            {a.storyTitle}
                            <span className="ml-2 text-[11px] font-normal text-ink-500">
                              {a.language} · Lv {a.difficulty}
                            </span>
                          </Link>
                          <div className="flex items-center gap-3">
                            <StarRating
                              assignmentId={a.id}
                              initial={a.rating ?? null}
                            />
                            <RemoveAssignmentButton id={a.id} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
