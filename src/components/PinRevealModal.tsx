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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-2xl tracking-tight text-ink-900">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-sm text-ink-600">{subtitle}</p>
        )}
        <div className="mt-5 rounded-2xl border border-ink-200 bg-ink-50 p-4 text-center">
          <div className="text-[10px] font-medium uppercase tracking-widest text-ink-500">
            6-digit PIN
          </div>
          <div className="mt-2 font-mono text-4xl font-bold tracking-[0.3em] text-ink-900">
            {pin}
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-500">
          This PIN will not be shown again. Copy it now and share it with the
          student.
        </p>
        <div className="mt-5 flex gap-2">
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
