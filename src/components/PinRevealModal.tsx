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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl tracking-tight text-ink-900 sm:text-2xl">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-sm text-ink-600">{subtitle}</p>
        )}
        <div className="mt-4 rounded-2xl border border-ink-200 bg-ink-50 p-3 sm:p-4">
          <div className="text-center text-[10px] font-medium uppercase tracking-widest text-ink-500">
            6-digit PIN
          </div>
          <div className="mt-2 flex justify-center gap-1.5 sm:gap-2">
            {digits.map((d, i) => (
              <span
                key={i}
                className="grid h-12 w-9 place-items-center rounded-lg bg-white font-mono text-2xl font-bold text-ink-900 shadow-sm ring-1 ring-ink-200 sm:h-14 sm:w-11 sm:text-3xl"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-500">
          This PIN will not be shown again. Copy it and share with the student.
        </p>
        <div className="mt-4 flex gap-2">
          <button onClick={copy} className="btn-ghost flex-1">
            {copied ? "Copied!" : "Copy PIN"}
          </button>
          <button onClick={onClose} className="btn-primary flex-1">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
