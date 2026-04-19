"use client";

import { useState, useTransition } from "react";
import { PinRevealModal } from "./PinRevealModal";

export function RegeneratePinButton({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [pending, start] = useTransition();
  const [reveal, setReveal] = useState<string | null>(null);

  function onClick() {
    if (
      !confirm(
        `Regenerate PIN for ${studentName}? Their old PIN will stop working immediately.`
      )
    )
      return;
    start(async () => {
      const res = await fetch(`/api/students/${studentId}/pin`, {
        method: "POST",
      });
      if (!res.ok) {
        alert(`Regenerate failed: ${await res.text()}`);
        return;
      }
      const data = (await res.json()) as { pin: string };
      setReveal(data.pin);
    });
  }

  return (
    <>
      <button
        onClick={onClick}
        disabled={pending}
        className="whitespace-nowrap text-xs font-medium text-ink-500 transition hover:text-brand-600 disabled:opacity-50"
      >
        {pending ? "…" : "Reset PIN"}
      </button>
      {reveal && (
        <PinRevealModal
          pin={reveal}
          title={`New PIN for ${studentName}`}
          subtitle="Share this new PIN with the student."
          onClose={() => setReveal(null)}
        />
      )}
    </>
  );
}
