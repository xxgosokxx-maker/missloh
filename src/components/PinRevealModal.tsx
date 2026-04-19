"use client";

import { useEffect, useRef, useState } from "react";

export function PinRevealModal({
  pin,
  title,
  subtitle,
  onClose,
}: {
  pin: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* Centring wrapper — never overflows, always visible */}
      <div className="flex h-full w-full items-center justify-center p-4">
        {/* Dialog box — intrinsic height, capped so it can never exceed the screen */}
        <div
          ref={dialogRef}
          className="flex w-full max-w-sm flex-col rounded-2xl bg-white shadow-2xl"
          style={{ maxHeight: "calc(100dvh - 2rem)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                {subtitle ?? "New PIN"}
              </p>
              <h2 className="mt-0.5 text-lg font-bold text-gray-900">{title}</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>

          {/* PIN digits */}
          <div className="flex justify-center gap-2 px-5 py-6">
            {pin.split("").map((d, i) => (
              <div
                key={i}
                className="flex h-14 w-10 items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-50 font-mono text-2xl font-black text-gray-900"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-5 py-4">
            <p className="mb-4 text-xs text-gray-500">
              This PIN won&apos;t be shown again — copy it and share with the student.
            </p>
            <div className="flex gap-2">
              <button
                onClick={copy}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95"
              >
                {copied ? "✓ Copied" : "Copy PIN"}
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
