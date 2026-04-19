import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, assignments, stories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { AssignStoryForm } from "@/components/AssignStoryForm";
import { RemoveAssignmentButton } from "@/components/RemoveAssignmentButton";
import { StarRating } from "@/components/StarRating";
import { EditStudentNameButton } from "@/components/EditStudentNameButton";
import { displayName } from "@/lib/names";

export const dynamic = "force-dynamic";

export default async function TeacherStudentsPage() {
  const session = await auth();

  const students = await db
    .select({ id: users.id, name: users.name, email: users.email })
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
      <div className="flex items-end justify-between">
        <h2 className="font-display text-3xl tracking-tight text-ink-900">
          Students
        </h2>
        <span className="badge">{students.length} enrolled</span>
      </div>

      {students.length === 0 && (
        <div className="card text-center text-ink-500">
          No students have signed in yet.
        </div>
      )}

      <ul className="space-y-4">
        {students.map((student) => {
          const theirs = myAssignments.filter(
            (a) => a.studentId === student.id
          );
          const initial = student.name?.[0]?.toUpperCase() ?? "·";
          const shortName = displayName(student.name);
          return (
            <li key={student.id} className="card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-accent-300 to-brand-400 text-sm font-semibold text-white shadow-soft">
                    {initial}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink-900">
                        {shortName}
                      </span>
                      <EditStudentNameButton
                        id={student.id}
                        currentName={student.name}
                      />
                    </div>
                    <div className="text-xs text-ink-500">{student.email}</div>
                  </div>
                </div>
                <AssignStoryForm
                  studentId={student.id}
                  stories={teacherStories}
                  assignedStoryIds={theirs.map((t) => t.storyId)}
                />
              </div>
              {theirs.length > 0 && (
                <ul className="mt-5 divide-y divide-ink-100 border-t border-ink-100">
                  {theirs.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/teacher/students/${student.id}/story/${a.storyId}`}
                          className="text-sm font-medium text-ink-800 transition hover:text-brand-600"
                        >
                          {a.storyTitle}
                        </Link>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="badge">{a.language}</span>
                          <span className="badge">Lv {a.difficulty}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
