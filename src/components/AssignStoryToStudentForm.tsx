"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type StudentOption = {
  id: string;
  name: string;
};

export function AssignStoryToStudentForm({
  storyId,
  students,
  assignedStudentIds,
  emptyLabel = "No students yet",
}: {
  storyId: string;
  students: StudentOption[];
  assignedStudentIds: string[];
  emptyLabel?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const available = useMemo(
    () => students.filter((s) => !assignedStudentIds.includes(s.id)),
    [students, assignedStudentIds]
  );
  const [pick, setPick] = useState(available[0]?.id ?? "");

  if (students.length === 0) {
    return <span className="text-xs text-ink-500">{emptyLabel}</span>;
  }
  if (available.length === 0) {
    return <span className="badge">All assigned</span>;
  }

  const effectivePick = available.some((s) => s.id === pick)
    ? pick
    : available[0].id;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={effectivePick}
        onChange={(e) => setPick(e.target.value)}
        className="input !mt-0 w-full sm:!w-auto sm:min-w-[12rem]"
        disabled={pending}
      >
        {available.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <button
        disabled={pending || !effectivePick}
        onClick={() =>
          start(async () => {
            await fetch("/api/assignments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ studentId: effectivePick, storyId }),
            });
            router.refresh();
          })
        }
        className="btn-primary"
      >
        {pending ? "…" : "Assign"}
      </button>
    </div>
  );
}
