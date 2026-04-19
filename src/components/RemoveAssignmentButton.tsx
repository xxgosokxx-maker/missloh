"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RemoveAssignmentButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() =>
        start(async () => {
          await fetch(`/api/assignments/${id}`, { method: "DELETE" });
          router.refresh();
        })
      }
      disabled={pending}
      className="text-xs font-medium text-ink-500 transition hover:text-red-600 disabled:opacity-50"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
