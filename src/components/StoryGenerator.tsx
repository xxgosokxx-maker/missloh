"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StoryGenerator() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get("title")),
      description: String(form.get("description")),
      difficulty: Number(form.get("difficulty")),
      language: String(form.get("language")),
      imageStyle: String(form.get("imageStyle")),
    };
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } catch (e: unknown) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2"
    >
      <label className="sm:col-span-2">
        <span className="text-sm text-slate-600">Title</span>
        <input
          required
          name="title"
          className="mt-1 w-full rounded-md border px-3 py-2"
          placeholder="The Cat Who Found A Mushroom"
        />
      </label>
      <label className="sm:col-span-2">
        <span className="text-sm text-slate-600">Description</span>
        <textarea
          required
          name="description"
          rows={3}
          className="mt-1 w-full rounded-md border px-3 py-2"
          placeholder="A whimsical tale about curiosity..."
        />
      </label>
      <label>
        <span className="text-sm text-slate-600">Language</span>
        <input
          required
          name="language"
          defaultValue="Mandarin"
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </label>
      <label>
        <span className="text-sm text-slate-600">Art style</span>
        <input
          required
          name="imageStyle"
          defaultValue="watercolor"
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </label>
      <label>
        <span className="text-sm text-slate-600">Difficulty (1–5)</span>
        <input
          type="number"
          name="difficulty"
          min={1}
          max={5}
          defaultValue={2}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </label>
      <div className="flex items-end">
        <button
          disabled={loading}
          className="w-full rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Generating…" : "Generate story"}
        </button>
      </div>
      {err && (
        <div className="sm:col-span-2 rounded bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}
    </form>
  );
}
