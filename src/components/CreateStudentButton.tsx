"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PinRevealModal } from "./PinRevealModal";

export function CreateStudentButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [reveal, setReveal] = useState<{ name: string; pin: string } | null>(
    null
  );

  function onClick() {
    const name = prompt("Student name")?.trim();
    if (!name) return;
    start(async () => {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        alert(`Create failed: ${await res.text()}`);
        return;
      }
      const data = (await res.json()) as { name: string; pin: string };
      setReveal({ name: data.name, pin: data.pin });
    });
  }

  return (
    <>
      <button
        onClick={onClick}
        disabled={pending}
        className="btn-primary text-sm"
      >
        {pending ? "Creating…" : "+ New student"}
      </button>
      {reveal && (
        <PinRevealModal
          pin={reveal.pin}
          title={`${reveal.name} added`}
          subtitle="Share this PIN with the student. Keep it private."
          onClose={() => {
            setReveal(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
