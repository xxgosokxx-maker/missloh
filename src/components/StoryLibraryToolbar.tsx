"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export type SortKey = "difficulty" | "least-assigned" | "newest";

export function StoryLibraryToolbar({
  sort,
  showArchived,
}: {
  sort: SortKey;
  showArchived: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  function update(next: Partial<{ sort: SortKey; archived: boolean }>) {
    const q = new URLSearchParams(params.toString());
    if (next.sort !== undefined) {
      if (next.sort === "difficulty") q.delete("sort");
      else q.set("sort", next.sort);
    }
    if (next.archived !== undefined) {
      if (next.archived) q.set("archived", "1");
      else q.delete("archived");
    }
    const qs = q.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="inline-flex items-center gap-2">
        <span className="sr-only">Sort stories</span>
        <select
          value={sort}
          onChange={(e) => update({ sort: e.target.value as SortKey })}
          disabled={pending}
          className="rounded-full border border-ink-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-ink-700 shadow-sm outline-none transition hover:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        >
          <option value="difficulty">Sort: Difficulty</option>
          <option value="least-assigned">Sort: Least assigned first</option>
          <option value="newest">Sort: Newest first</option>
        </select>
      </label>
      <label
        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
          showArchived
            ? "border-brand-300 bg-brand-50 text-brand-700"
            : "border-ink-200 bg-white/80 text-ink-600 hover:bg-white"
        }`}
      >
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => update({ archived: e.target.checked })}
          disabled={pending}
          className="h-3.5 w-3.5 rounded border-ink-300 text-brand-600 focus:ring-brand-200"
        />
        Show archived
      </label>
    </div>
  );
}
