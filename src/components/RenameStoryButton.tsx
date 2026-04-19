"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RenameStoryButton({
  id,
  currentTitle,
}: {
  id: string;
  currentTitle: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() =>
        start(async () => {
          const next = prompt("Rename story", currentTitle);
          const trimmed = next?.trim();
          if (!trimmed || trimmed === currentTitle) return;
          const res = await fetch(`/api/stories/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: trimmed }),
          });
          if (!res.ok) {
            alert(`Rename failed: ${await res.text()}`);
            return;
          }
          router.refresh();
        })
      }
      disabled={pending}
      className="text-xs font-medium text-ink-500 transition hover:text-brand-600 disabled:opacity-50"
    >
      {pending ? "Renaming…" : "Rename"}
    </button>
  );
}
