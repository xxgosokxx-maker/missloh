"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export type SortKey = "difficulty" | "least-assigned" | "newest" | "title";

export function StoryLibraryToolbar({
  sort,
  showArchived,
  query,
}: {
  sort: SortKey;
  showArchived: boolean;
  query: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  function update(next: Partial<{ sort: SortKey; archived: boolean; q: string }>) {
    const q = new URLSearchParams(params.toString());
    if (next.sort !== undefined) {
      if (next.sort === "difficulty") q.delete("sort");
      else q.set("sort", next.sort);
    }
    if (next.archived !== undefined) {
      if (next.archived) q.set("archived", "1");
      else q.delete("archived");
    }
    if (next.q !== undefined) {
      const trimmed = next.q.trim();
      if (trimmed) q.set("q", trimmed);
      else q.delete("q");
    }
    const qs = q.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  }

  function onSearchChange(value: string) {
    setDraft(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update({ q: value }), 250);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative inline-flex flex-1 items-center sm:flex-initial">
        <span className="sr-only">Search stories</span>
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 text-ink-400"
        >
          ⌕
        </span>
        <input
          type="search"
          value={draft}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search titles…"
          className="w-full rounded-full border border-ink-200 bg-white/80 py-1.5 pl-8 pr-3 text-xs font-medium text-ink-700 shadow-sm outline-none transition placeholder:text-ink-400 hover:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 sm:w-56"
        />
      </label>
      <label className="inline-flex items-center gap-2">
        <span className="sr-only">Sort stories</span>
        <select
          value={sort}
          onChange={(e) => update({ sort: e.target.value as SortKey })}
          disabled={pending}
          className="rounded-full border border-ink-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-ink-700 shadow-sm outline-none transition hover:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        >
          <option value="difficulty">Sort: Difficulty</option>
          <option value="title">Sort: Title (A–Z)</option>
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
