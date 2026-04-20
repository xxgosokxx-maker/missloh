"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function EvaluateStoryButton({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        disabled={pending}
        className="btn-primary"
        onClick={() =>
          start(async () => {
            setMsg(null);
            setErr(null);
            try {
              const res = await fetch(
                `/api/assignments/${assignmentId}/evaluate`,
                { method: "POST" }
              );
              if (!res.ok) {
                throw new Error(await res.text());
              }
              const data = (await res.json()) as {
                evaluated: number;
                inaudible?: number;
                failed: number;
                errors: string[];
                averageRating: number | null;
              };
              const parts = [`Scored ${data.evaluated} scene${data.evaluated === 1 ? "" : "s"}`];
              if (data.inaudible && data.inaudible > 0) {
                parts.push(`${data.inaudible} inaudible`);
              }
              if (data.failed > 0) parts.push(`${data.failed} failed`);
              if (data.averageRating != null) {
                parts.push(`★ ${data.averageRating}/5 avg`);
              }
              setMsg(parts.join(" · "));
              router.refresh();
            } catch (e) {
              setErr((e as Error).message || "Evaluation failed");
            }
          })
        }
      >
        {pending ? "Evaluating…" : "Evaluate story"}
      </button>
      {msg && (
        <span className="text-xs text-ink-600">{msg}</span>
      )}
      {err && (
        <span className="text-xs text-red-700">{err}</span>
      )}
    </div>
  );
}
