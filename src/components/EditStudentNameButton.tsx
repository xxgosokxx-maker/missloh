"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function EditStudentNameButton({
  id,
  currentName,
}: {
  id: string;
  currentName: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() =>
        start(async () => {
          const next = prompt("Edit student name", currentName ?? "");
          const trimmed = next?.trim();
          if (!trimmed || trimmed === currentName) return;
          const res = await fetch(`/api/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: trimmed }),
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
      aria-label="Edit student name"
    >
      {pending ? "Saving…" : "Edit"}
    </button>
  );
}
