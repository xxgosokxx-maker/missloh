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
      voice: String(form.get("voice")),
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
    <form onSubmit={onSubmit} className="card grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <span className="label">Title</span>
        <input
          required
          name="title"
          className="input"
          placeholder="The Cat Who Found A Mushroom"
        />
      </label>
      <label className="sm:col-span-2">
        <span className="label">Description</span>
        <textarea
          required
          name="description"
          rows={3}
          className="input"
          placeholder="A whimsical tale about curiosity…"
        />
      </label>
      <label>
        <span className="label">Language</span>
        <select required name="language" defaultValue="Mandarin" className="input">
          <option value="French">French</option>
          <option value="Mandarin">Mandarin</option>
        </select>
      </label>
      <label>
        <span className="label">Art style</span>
        <select required name="imageStyle" defaultValue="Ghibli" className="input">
          <option value="Marvel">Marvel</option>
          <option value="Disney">Disney</option>
          <option value="Ghibli">Ghibli</option>
          <option value="Lego">Lego</option>
          <option value="Toriyama">Toriyama</option>
          <option value="Chibi / Super Deformed">Chibi / Super Deformed</option>
          <option value="Ligne Claire">Ligne Claire</option>
          <option value="90s Cel-Shaded Anime">90s Cel-Shaded Anime</option>
          <option value="CalArts">CalArts</option>
          <option value="Ukiyo-e">Ukiyo-e</option>
          <option value="90s Mecha">90s Mecha</option>
          <option value="Classic Shonen">Classic Shonen</option>
          <option value="Shojo">Shojo</option>
        </select>
      </label>
      <label>
        <span className="label">Difficulty (1–9)</span>
        <input
          type="number"
          name="difficulty"
          min={1}
          max={9}
          defaultValue={2}
          className="input"
        />
      </label>
      <label className="sm:col-span-2">
        <span className="label">Narrator voice</span>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <VoicePill value="female" defaultChecked>
            ♀ Female
          </VoicePill>
          <VoicePill value="male">♂ Male</VoicePill>
        </div>
      </label>
      <div className="flex items-end sm:col-span-2">
        <button disabled={loading} className="btn-primary w-full">
          {loading ? "Generating…" : "Generate story"}
        </button>
      </div>
      {err && (
        <div className="sm:col-span-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}
    </form>
  );
}

function VoicePill({
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
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-white peer-checked:border-brand-500 peer-checked:bg-gradient-to-br peer-checked:from-brand-50 peer-checked:to-accent-50 peer-checked:text-brand-700 peer-checked:shadow-soft peer-checked:ring-1 peer-checked:ring-brand-300">
        {children}
      </div>
    </label>
  );
}
