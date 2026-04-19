"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ArchiveStoryButton({
  id,
  archived,
}: {
  id: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      onClick={() =>
        start(async () => {
          const res = await fetch(`/api/stories/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ archived: !archived }),
          });
          if (!res.ok) {
            alert(`Failed: ${await res.text()}`);
            return;
          }
          router.refresh();
        })
      }
      disabled={pending}
      className="text-xs font-medium text-ink-500 transition hover:text-brand-600 disabled:opacity-50"
    >
      {pending ? "…" : archived ? "Unarchive" : "Archive"}
    </button>
  );
}
