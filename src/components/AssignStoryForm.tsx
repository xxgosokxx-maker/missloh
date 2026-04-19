"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type StoryOption = {
  id: string;
  title: string;
  language: string;
  difficulty: number;
};

function optionLabel(s: StoryOption): string {
  return `${s.title} — ${s.language} · Lv ${s.difficulty}`;
}

export function AssignStoryForm({
  studentId,
  stories,
  assignedStoryIds,
}: {
  studentId: string;
  stories: StoryOption[];
  assignedStoryIds: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const available = stories.filter((s) => !assignedStoryIds.includes(s.id));
  const [pick, setPick] = useState(available[0]?.id ?? "");
  const selected = available.find((s) => s.id === pick);

  if (available.length === 0) {
    return <span className="badge">All assigned</span>;
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={pick}
          onChange={(e) => setPick(e.target.value)}
          className="input !mt-0 w-full sm:!w-auto sm:min-w-[16rem]"
        >
          {available.map((s) => (
            <option key={s.id} value={s.id}>
              {optionLabel(s)}
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
          className="btn-primary"
        >
          {pending ? "…" : "Assign"}
        </button>
      </div>
      {selected && (
        <div className="flex flex-wrap gap-1.5">
          <span className="badge">{selected.language}</span>
          <span className="badge">Lv {selected.difficulty}</span>
        </div>
      )}
    </div>
  );
}
