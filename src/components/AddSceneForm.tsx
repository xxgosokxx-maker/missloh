"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { compressImageToWebp } from "@/lib/clientImage";

type Phase = "idle" | "compressing" | "uploading" | "creating";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "Add scene",
  compressing: "Compressing image…",
  uploading: "Uploading image…",
  creating: "Generating audio…",
};

export function AddSceneForm({ storyId }: { storyId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [subtitle, setSubtitle] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  const loading = phase !== "idle";

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pickImage(files: FileList | File[] | null | undefined) {
    if (!files) return;
    const arr = Array.from(files);
    const img = arr.find((f) => f.type.startsWith("image/"));
    if (img) setFile(img);
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    pickImage(e.target.files);
    e.target.value = "";
  }

  function onPaste(e: ClipboardEvent<HTMLDivElement | HTMLFormElement>) {
    if (loading) return;
    const pasted: File[] = [];
    for (const item of Array.from(e.clipboardData?.items ?? [])) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const f = item.getAsFile();
        if (f) pasted.push(f);
      }
    }
    if (pasted.length === 0) return;
    e.preventDefault();
    e.stopPropagation();
    pickImage(pasted);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setHover(false);
    if (loading) return;
    pickImage(e.dataTransfer.files);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!loading) setHover(true);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    if (!file) {
      setErr("Pick an image for the new scene.");
      return;
    }
    if (!subtitle.trim()) {
      setErr("Add a subtitle for the new scene.");
      return;
    }

    try {
      setPhase("compressing");
      const blob = await compressImageToWebp(file);

      setPhase("uploading");
      const uploaded = await upload(
        `stories/${storyId}/added-${Date.now()}.webp`,
        blob,
        {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: "image/webp",
        }
      );

      setPhase("creating");
      const res = await fetch(`/api/stories/${storyId}/scenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtitle: subtitle.trim(),
          imageUrl: uploaded.url,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      setFile(null);
      setSubtitle("");
      setPhase("idle");
      router.refresh();
    } catch (e: unknown) {
      setErr((e as Error).message || "Something went wrong.");
      setPhase("idle");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      onPaste={onPaste}
      className="card grid gap-4 sm:grid-cols-[10rem_1fr]"
    >
      <div className="sm:col-span-2">
        <h2 className="font-display text-xl tracking-tight text-ink-900">
          Add a new scene
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Appended to the end of the story. Audio is generated using the story&apos;s narrator voice.
        </p>
      </div>

      <div
        ref={zoneRef}
        onPaste={onPaste}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setHover(false)}
        onClick={() => zoneRef.current?.focus()}
        tabIndex={loading ? -1 : 0}
        role="region"
        aria-label="Scene image: drag, drop, paste, or browse"
        className={`relative h-40 w-full overflow-hidden rounded-2xl border-2 border-dashed text-sm text-ink-500 outline-none transition focus-visible:ring-2 focus-visible:ring-brand-400 sm:h-40 ${
          hover ? "border-brand-500 bg-brand-50/70" : "border-ink-200 bg-white/60 hover:bg-white"
        } ${loading ? "pointer-events-none opacity-60" : ""}`}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              disabled={loading}
              className="absolute right-2 top-2 rounded-full bg-ink-900/70 px-3 py-1 text-xs font-medium text-white hover:bg-ink-900"
            >
              Replace
            </button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center">
            <span>Drop, paste, or</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              disabled={loading}
              className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
            >
              browse files
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
          onChange={onPick}
          className="sr-only"
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="label !mt-0">Subtitle</span>
        <textarea
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Write what the student reads aloud for this scene…"
          rows={3}
          className="input !mt-0"
          disabled={loading}
        />
      </div>

      <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {PHASE_LABEL[phase]}
        </button>
        {err && (
          <span className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </span>
        )}
      </div>
    </form>
  );
}
