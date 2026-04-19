"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RemixStoryButton({
  storyId,
  originalTitle,
}: {
  storyId: string;
  originalTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      language: String(form.get("language")),
      difficulty: Number(form.get("difficulty")),
      title: String(form.get("title") ?? "").trim() || undefined,
      voice: String(form.get("voice")),
    };
    try {
      const res = await fetch(`/api/stories/${storyId}/remix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setOpen(false);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition hover:text-brand-700"
      >
        <span aria-hidden>✦</span> Remix
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-ink-100 bg-ink-50/70 p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="label">Language</span>
          <select name="language" defaultValue="French" className="input">
            <option value="French">French</option>
            <option value="Mandarin">Mandarin</option>
          </select>
        </label>
        <label>
          <span className="label">Difficulty (1–9)</span>
          <input
            type="number"
            name="difficulty"
            min={1}
            max={9}
            defaultValue={3}
            className="input"
          />
        </label>
      </div>
      <label className="mt-3 block">
        <span className="label">Title (optional)</span>
        <input name="title" placeholder={originalTitle} className="input" />
      </label>
      <div className="mt-3">
        <span className="label">Narrator voice</span>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <RemixVoicePill value="female" defaultChecked>
            ♀ Female
          </RemixVoicePill>
          <RemixVoicePill value="male">♂ Male</RemixVoicePill>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button disabled={loading} className="btn-primary flex-1">
          {loading ? "Remixing…" : "Create remix"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={loading}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
      {err && <div className="mt-2 text-xs text-red-600">{err}</div>}
    </form>
  );
}

function RemixVoicePill({
  value,
  defaultChecked,
  children,
}: {
  value: string;
  defaultChecked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="relative cursor-pointer">
      <input
        type="radio"
        name="voice"
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <div className="flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white/80 px-3 py-2 text-xs font-medium text-ink-700 transition peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-checked:ring-1 peer-checked:ring-brand-300">
        {children}
      </div>
    </label>
  );
}
