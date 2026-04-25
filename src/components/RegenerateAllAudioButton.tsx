"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RegenerateAllAudioButton({
  storyId,
  sceneCount,
}: {
  storyId: string;
  sceneCount: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onClick() {
    if (
      !confirm(
        `Regenerate audio for all ${sceneCount} scene${sceneCount === 1 ? "" : "s"}? This will overwrite the current narration.`
      )
    ) {
      return;
    }
    start(async () => {
      setErr(null);
      try {
        const res = await fetch(
          `/api/stories/${storyId}/regenerate-audio`,
          { method: "POST" }
        );
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { failed: number };
        if (data.failed > 0) {
          setErr(
            `${data.failed} scene${data.failed === 1 ? "" : "s"} failed.`
          );
        }
        router.refresh();
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClick}
        disabled={pending || sceneCount === 0}
        className="rounded-full border border-ink-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-ink-700 shadow-sm transition hover:bg-white hover:text-brand-700 disabled:opacity-50"
        title="Regenerate audio for every scene in this story"
      >
        <span aria-hidden>🔊</span>{" "}
        {pending ? "Regenerating…" : "Regenerate all audio"}
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}
