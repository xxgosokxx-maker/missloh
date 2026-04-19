"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function DeleteStoryButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() =>
        start(async () => {
          if (!confirm("Delete this story and all its scenes?")) return;
          await fetch(`/api/stories/${id}`, { method: "DELETE" });
          router.refresh();
        })
      }
      disabled={pending}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
