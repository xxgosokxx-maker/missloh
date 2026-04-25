"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const OPTIONS = ["", "French", "Mandarin"] as const;
type Option = (typeof OPTIONS)[number];

export function StudentTagSelect({
  studentId,
  initial,
}: {
  studentId: string;
  initial: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState<Option>(
    (initial as Option) ?? ""
  );

  function onChange(next: Option) {
    const previous = value;
    setValue(next);
    start(async () => {
      const res = await fetch(`/api/users/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: next === "" ? null : next }),
      });
      if (!res.ok) {
        setValue(previous);
        alert(`Tag update failed: ${await res.text()}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Option)}
      disabled={pending}
      aria-label="Student language tag"
      className="rounded-full border border-ink-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-ink-700 shadow-sm outline-none transition hover:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
    >
      <option value="">No tag</option>
      <option value="French">French</option>
      <option value="Mandarin">Mandarin</option>
    </select>
  );
}
