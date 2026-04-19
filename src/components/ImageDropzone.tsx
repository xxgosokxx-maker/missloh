"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";

export function ImageDropzone({
  onAddScenes,
  disabled,
}: {
  onAddScenes: (files: File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  function handleFiles(list: FileList | null) {
    if (!list) return;
    const files = Array.from(list).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length > 0) onAddScenes(files);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setHover(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled) setHover(true);
  }

  function onDragLeave() {
    setHover(false);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    e.target.value = "";
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`flex min-h-[8rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
        hover
          ? "border-brand-500 bg-brand-50/70"
          : "border-ink-200 bg-white/40 hover:bg-white/70"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      onClick={() => inputRef.current?.click()}
      role="button"
      aria-label="Add scene images"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onChange}
        className="sr-only"
        disabled={disabled}
      />
      <div className="text-sm font-medium text-ink-800">
        Click to browse, drag &amp; drop, or paste a screenshot
      </div>
      <div className="text-xs text-ink-500">
        Each image becomes a new scene · PNG, JPG, WebP
      </div>
    </div>
  );
}
