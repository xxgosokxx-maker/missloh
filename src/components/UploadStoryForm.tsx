"use client";

import { useRouter } from "next/navigation";
import { useState, type ClipboardEvent, type FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import { compressImageToWebp } from "@/lib/clientImage";
import { ImageDropzone } from "@/components/ImageDropzone";
import { SceneRow, type SceneDraft } from "@/components/SceneRow";

type Phase = "idle" | "compressing" | "uploading" | "creating";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "Create story",
  compressing: "Compressing images…",
  uploading: "Uploading images…",
  creating: "Creating story (generating audio)…",
};

export function UploadStoryForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("Mandarin");
  const [level, setLevel] = useState(2);
  const [voice, setVoice] = useState<"female" | "male">("female");
  const [scenesList, setScenesList] = useState<SceneDraft[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [err, setErr] = useState<string | null>(null);

  const loading = phase !== "idle";

  function addScenesFromFiles(files: File[]) {
    if (files.length === 0) return;
    const fresh: SceneDraft[] = files.map((file) => ({
      key: crypto.randomUUID(),
      file,
      subtitle: "",
    }));
    setScenesList((prev) => [...prev, ...fresh]);
  }

  function onPaste(e: ClipboardEvent<HTMLFormElement>) {
    const files: File[] = [];
    for (const item of Array.from(e.clipboardData?.items ?? [])) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length === 0) return;
    e.preventDefault();
    addScenesFromFiles(files);
  }

  function updateScene(key: string, patch: Partial<SceneDraft>) {
    setScenesList((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...patch } : s))
    );
  }

  function moveScene(key: string, dir: -1 | 1) {
    setScenesList((prev) => {
      const idx = prev.findIndex((s) => s.key === key);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  }

  function removeScene(key: string) {
    setScenesList((prev) => prev.filter((s) => s.key !== key));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    if (!title.trim()) {
      setErr("Title is required.");
      return;
    }
    if (scenesList.length === 0) {
      setErr("Add at least one scene.");
      return;
    }
    for (const [i, s] of scenesList.entries()) {
      if (!s.subtitle.trim()) {
        setErr(`Scene ${i + 1} is missing a subtitle.`);
        return;
      }
    }

    const tempId = crypto.randomUUID();

    try {
      setPhase("compressing");
      const compressed = await Promise.all(
        scenesList.map((s) => compressImageToWebp(s.file))
      );

      setPhase("uploading");
      const uploaded = await Promise.all(
        compressed.map((blob, i) =>
          upload(
            `stories/upload/${tempId}/scene-${i}.webp`,
            blob,
            {
              access: "public",
              handleUploadUrl: "/api/upload",
              contentType: "image/webp",
            }
          )
        )
      );

      setPhase("creating");
      const res = await fetch("/api/stories/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          language,
          difficulty: level,
          voice,
          scenes: scenesList.map((s, i) => ({
            subtitle: s.subtitle.trim(),
            imageUrl: uploaded[i].url,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { id } = (await res.json()) as { id: string };
      router.push(`/teacher/stories/${id}`);
    } catch (e: unknown) {
      setErr((e as Error).message || "Something went wrong.");
      setPhase("idle");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      onPaste={onPaste}
      className="card grid gap-4 sm:grid-cols-2"
    >
      <label className="sm:col-span-2">
        <span className="label">Title</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="The Day At The Market"
          disabled={loading}
        />
      </label>

      <label>
        <span className="label">Language</span>
        <select
          required
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="input"
          disabled={loading}
        >
          <option value="French">French</option>
          <option value="Mandarin">Mandarin</option>
        </select>
      </label>

      <label>
        <span className="label">Level (1–9)</span>
        <select
          required
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="input"
          disabled={loading}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <label className="sm:col-span-2">
        <span className="label">Narrator voice</span>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <VoicePill
            value="female"
            checked={voice === "female"}
            onSelect={() => setVoice("female")}
            disabled={loading}
          >
            ♀ Female
          </VoicePill>
          <VoicePill
            value="male"
            checked={voice === "male"}
            onSelect={() => setVoice("male")}
            disabled={loading}
          >
            ♂ Male
          </VoicePill>
        </div>
      </label>

      <div className="sm:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <span className="label !mt-0">Scenes</span>
          <span className="text-xs text-ink-500">
            {scenesList.length} added
            {scenesList.length > 10 ? " · consider trimming" : ""}
          </span>
        </div>

        {scenesList.length > 0 && (
          <ul className="space-y-2">
            {scenesList.map((s, i) => (
              <SceneRow
                key={s.key}
                scene={s}
                index={i}
                total={scenesList.length}
                onSubtitleChange={(subtitle) => updateScene(s.key, { subtitle })}
                onReplaceFile={(file) => updateScene(s.key, { file })}
                onMoveUp={() => moveScene(s.key, -1)}
                onMoveDown={() => moveScene(s.key, 1)}
                onRemove={() => removeScene(s.key)}
                disabled={loading}
              />
            ))}
          </ul>
        )}

        <ImageDropzone onAddScenes={addScenesFromFiles} disabled={loading} />
      </div>

      <div className="flex items-end sm:col-span-2">
        <button disabled={loading} className="btn-primary w-full">
          {PHASE_LABEL[phase]}
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
  checked,
  onSelect,
  disabled,
  children,
}: {
  value: string;
  checked: boolean;
  onSelect: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="relative cursor-pointer">
      <input
        type="radio"
        name="voice"
        value={value}
        checked={checked}
        onChange={onSelect}
        disabled={disabled}
        className="peer sr-only"
      />
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-white peer-checked:border-brand-500 peer-checked:bg-gradient-to-br peer-checked:from-brand-50 peer-checked:to-accent-50 peer-checked:text-brand-700 peer-checked:shadow-soft peer-checked:ring-1 peer-checked:ring-brand-300">
        {children}
      </div>
    </label>
  );
}
