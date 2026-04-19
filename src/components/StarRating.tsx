"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function StarRating({
  assignmentId,
  initial,
}: {
  assignmentId: string;
  initial: number | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState<number>(initial ?? 0);
  const [hover, setHover] = useState<number>(0);
  const [pending, start] = useTransition();
  const shown = hover || value;

  function save(next: number) {
    const nextRating = next === value ? 0 : next;
    setValue(nextRating);
    start(async () => {
      await fetch(`/api/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: nextRating || null }),
      });
      router.refresh();
    });
  }

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHover(0)}
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= shown;
        return (
          <button
            key={n}
            type="button"
            disabled={pending}
            onMouseEnter={() => setHover(n)}
            onClick={() => save(n)}
            className="p-0.5 transition disabled:opacity-60"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              className={
                filled
                  ? "fill-accent-400 stroke-accent-500"
                  : "fill-transparent stroke-ink-300"
              }
              strokeWidth={1.5}
            >
              <path d="M10 1.8l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 15.1l-5.2 2.7 1-5.8L1.6 7.9l5.8-.8L10 1.8z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
