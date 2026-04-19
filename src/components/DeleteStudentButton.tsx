"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function DeleteStudentButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() =>
        start(async () => {
          if (
            !confirm(
              `Delete ${name}? This removes their assignments and recordings.`
            )
          )
            return;
          const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
          if (!res.ok) {
            alert(`Delete failed: ${await res.text()}`);
            return;
          }
          router.refresh();
        })
      }
      disabled={pending}
      className="text-xs font-medium text-rose-600 transition hover:text-rose-700 disabled:opacity-50"
      aria-label="Delete student"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
