"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

export type SceneDraft = {
  key: string;
  file: File;
  subtitle: string;
};

export function SceneRow({
  scene,
  index,
  total,
  onSubtitleChange,
  onReplaceFile,
  onMoveUp,
  onMoveDown,
  onRemove,
  disabled,
}: {
  scene: SceneDraft;
  index: number;
  total: number;
  onSubtitleChange: (subtitle: string) => void;
  onReplaceFile: (file: File) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(scene.file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [scene.file]);

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith("image/")) onReplaceFile(f);
    e.target.value = "";
  }

  return (
    <li className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-start">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative h-28 w-full shrink-0 overflow-hidden rounded-xl border border-ink-200 bg-ink-50 sm:w-40"
        aria-label={`Scene ${index + 1} image (click to replace)`}
        disabled={disabled}
      >
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        <span className="absolute inset-0 hidden items-center justify-center bg-ink-900/50 text-xs font-medium text-white group-hover:flex">
          Replace
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onPick}
          className="sr-only"
          disabled={disabled}
        />
      </button>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-ink-500">
            Scene {index + 1}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={disabled || index === 0}
              className="rounded-lg px-2 py-1 text-xs text-ink-600 transition hover:bg-ink-100 disabled:opacity-30"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={disabled || index === total - 1}
              className="rounded-lg px-2 py-1 text-xs text-ink-600 transition hover:bg-ink-100 disabled:opacity-30"
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="rounded-lg px-2 py-1 text-xs text-rose-600 transition hover:bg-rose-50 disabled:opacity-30"
              aria-label="Remove scene"
            >
              ✕
            </button>
          </div>
        </div>
        <textarea
          required
          value={scene.subtitle}
          onChange={(e) => onSubtitleChange(e.target.value)}
          placeholder="Write what the student reads aloud for this scene…"
          rows={2}
          className="input !mt-0"
          disabled={disabled}
        />
      </div>
    </li>
  );
}
