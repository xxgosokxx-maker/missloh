"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

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
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-ink-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full flex-col overflow-y-auto bg-white p-6 shadow-lift sm:h-auto sm:max-h-[calc(100vh-2rem)] sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-2xl tracking-tight text-ink-900">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-sm text-ink-600">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-m-2 shrink-0 rounded-full p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          >
            <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="mt-6 rounded-3xl border border-ink-200 bg-gradient-to-br from-brand-50 via-white to-accent-50 p-5">
          <div className="text-center text-[11px] font-medium uppercase tracking-widest text-ink-500">
            6-digit PIN
          </div>
          <div className="mt-3 flex justify-center gap-2">
            {digits.map((d, i) => (
              <span
                key={i}
                className="grid h-14 w-10 place-items-center rounded-xl bg-white font-mono text-3xl font-bold text-ink-900 shadow-sm ring-1 ring-ink-200 sm:h-16 sm:w-12"
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm text-ink-500">
          This PIN will not be shown again. Copy it and share with the student.
        </p>

        <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row">
          <button onClick={copy} className="btn-ghost w-full sm:flex-1">
            {copied ? "Copied!" : "Copy PIN"}
          </button>
          <button onClick={onClose} className="btn-primary w-full sm:flex-1">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
