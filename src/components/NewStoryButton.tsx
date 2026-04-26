"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function NewStoryButton() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-primary"
      >
        + New story
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-ink-100 bg-white/95 shadow-lift backdrop-blur"
        >
          <MenuLink
            href="/teacher/stories/new"
            title="Generate with AI"
            description="Pick a theme and language; we draft, illustrate, and narrate it."
            onClick={() => setOpen(false)}
          />
          <div className="border-t border-ink-100" />
          <MenuLink
            href="/teacher/stories/upload"
            title="Upload pages"
            description="Use your own book images; we transcribe and narrate the captions."
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  title,
  description,
  onClick,
}: {
  href: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="block px-4 py-3 transition hover:bg-brand-50/60 focus:bg-brand-50/60 focus:outline-none"
    >
      <div className="text-sm font-medium text-ink-900">{title}</div>
      <div className="mt-0.5 text-xs text-ink-500">{description}</div>
    </Link>
  );
}
