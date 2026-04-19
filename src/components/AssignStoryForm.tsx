"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AssignStoryForm({
  studentId,
  stories,
  assignedStoryIds,
}: {
  studentId: string;
  stories: { id: string; title: string }[];
  assignedStoryIds: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const available = stories.filter((s) => !assignedStoryIds.includes(s.id));
  const [pick, setPick] = useState(available[0]?.id ?? "");

  if (available.length === 0) {
    return <span className="text-xs text-slate-400">All assigned</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={pick}
        onChange={(e) => setPick(e.target.value)}
        className="rounded-md border px-2 py-1 text-sm"
      >
        {available.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </select>
      <button
        disabled={pending || !pick}
        onClick={() =>
          start(async () => {
            await fetch("/api/assignments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ studentId, storyId: pick }),
            });
            router.refresh();
          })
        }
        className="rounded-md bg-brand-600 px-3 py-1 text-sm text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "…" : "Assign"}
      </button>
    </div>
  );
}
