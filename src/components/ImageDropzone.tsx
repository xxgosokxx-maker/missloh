"use client";

import {
  useRef,
  useState,
  type DragEvent,
  type ChangeEvent,
  type ClipboardEvent,
} from "react";

export function ImageDropzone({
  onAddScenes,
  disabled,
}: {
  onAddScenes: (files: File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  function handleFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length > 0) onAddScenes(images);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setHover(false);
    if (disabled) return;
    handleFiles(Array.from(e.dataTransfer.files ?? []));
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled) setHover(true);
  }

  function onDragLeave() {
    setHover(false);
  }

  function onPaste(e: ClipboardEvent<HTMLDivElement>) {
    if (disabled) return;
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
    handleFiles(pasted);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  }

  function focusZone() {
    zoneRef.current?.focus();
  }

  return (
    <div
      ref={zoneRef}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onPaste={onPaste}
      onClick={focusZone}
      tabIndex={disabled ? -1 : 0}
      role="region"
      aria-label="Add scene images: drag, drop, paste, or browse"
      className={`flex min-h-[8rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
        hover
          ? "border-brand-500 bg-brand-50/70"
          : "border-ink-200 bg-white/40 hover:bg-white/70"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
        multiple
        onChange={onChange}
        className="sr-only"
        disabled={disabled}
      />
      <div className="text-sm font-medium text-ink-800">
        Drag &amp; drop, paste a screenshot, or{" "}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          disabled={disabled}
          className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
        >
          browse files
        </button>
      </div>
      <div className="text-xs text-ink-500">
        Each image becomes a new scene · PNG, JPG, WebP
      </div>
    </div>
  );
}
