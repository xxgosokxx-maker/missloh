"use client";

import { useState } from "react";

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

  async function copy() {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can fail in insecure contexts; silently ignore.
    }
  }

  const digits = pin.split("");

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-3">
        <div
          className="card w-full max-w-md p-4 sm:p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-lg tracking-tight text-ink-900 sm:text-xl">
                {title}
              </h3>
              {subtitle && (
                <p className="mt-0.5 text-xs text-ink-600">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="-m-1 shrink-0 rounded-full p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
          <div className="mt-3 flex justify-center gap-1.5 sm:gap-2">
            {digits.map((d, i) => (
              <span
                key={i}
                className="grid h-12 w-9 place-items-center rounded-lg bg-ink-50 font-mono text-2xl font-bold text-ink-900 ring-1 ring-ink-200 sm:h-14 sm:w-11 sm:text-3xl"
              >
                {d}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <p className="flex-1 text-[11px] leading-tight text-ink-500">
              PIN will not be shown again — copy and share it.
            </p>
            <button
              onClick={copy}
              className="btn-primary shrink-0 whitespace-nowrap px-3 py-1.5 text-xs"
            >
              {copied ? "Copied!" : "Copy PIN"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
