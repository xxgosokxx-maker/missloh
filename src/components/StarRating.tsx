"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

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
  const gradId = useId();
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
        const full = shown >= n;
        const half = !full && shown >= n - 0.5;
        const gradientId = `${gradId}-star-${n}`;
        const fill = full
          ? "#efbb24"
          : half
            ? `url(#${gradientId})`
            : "transparent";
        const stroke = full || half ? "#d89c14" : "#b5afa1";
        return (
          <span key={n} className="relative inline-block h-[22px] w-[22px]">
            <svg
              width="22"
              height="22"
              viewBox="0 0 20 20"
              className="pointer-events-none absolute inset-0"
              strokeWidth={1.5}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor="#efbb24" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path
                d="M10 1.8l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 15.1l-5.2 2.7 1-5.8L1.6 7.9l5.8-.8L10 1.8z"
                fill={fill}
                stroke={stroke}
              />
            </svg>
            <button
              type="button"
              disabled={pending}
              onMouseEnter={() => setHover(n - 0.5)}
              onClick={() => save(n - 0.5)}
              className="absolute inset-y-0 left-0 w-1/2 disabled:opacity-60"
              aria-label={`${n - 0.5} stars`}
            />
            <button
              type="button"
              disabled={pending}
              onMouseEnter={() => setHover(n)}
              onClick={() => save(n)}
              className="absolute inset-y-0 right-0 w-1/2 disabled:opacity-60"
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
            />
          </span>
        );
      })}
    </div>
  );
}
