import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, assignments, stories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { AssignStoryForm } from "@/components/AssignStoryForm";
import { RemoveAssignmentButton } from "@/components/RemoveAssignmentButton";

export const dynamic = "force-dynamic";

export default async function TeacherStudentsPage() {
  const session = await auth();

  const students = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.role, "student"));

  const teacherStories = await db
    .select({ id: stories.id, title: stories.title })
    .from(stories)
    .where(eq(stories.creatorId, session!.user.id))
    .orderBy(desc(stories.createdAt));

  const myAssignments = await db
    .select({
      id: assignments.id,
      studentId: assignments.studentId,
      storyId: assignments.storyId,
      storyTitle: stories.title,
    })
    .from(assignments)
    .innerJoin(stories, eq(stories.id, assignments.storyId))
    .where(eq(assignments.assignedBy, session!.user.id));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h2 className="text-xl font-semibold">Students</h2>
      {students.length === 0 && (
        <p className="text-slate-500">No students have signed in yet.</p>
      )}
      <ul className="space-y-4">
        {students.map((student) => {
          const theirs = myAssignments.filter(
            (a) => a.studentId === student.id
          );
          return (
            <li
              key={student.id}
              className="rounded-xl border bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-slate-500">{student.email}</div>
                </div>
                <AssignStoryForm
                  studentId={student.id}
                  stories={teacherStories}
                  assignedStoryIds={theirs.map((t) => t.storyId)}
                />
              </div>
              {theirs.length > 0 && (
                <ul className="mt-4 divide-y">
                  {theirs.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between py-2"
                    >
                      <Link
                        href={`/teacher/students/${student.id}/story/${a.storyId}`}
                        className="text-sm text-brand-700 hover:underline"
                      >
                        {a.storyTitle}
                      </Link>
                      <RemoveAssignmentButton id={a.id} />
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
