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
      className="text-xs text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
