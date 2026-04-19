"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ClassCode = {
  id: string;
  code: string;
  label: string | null;
};

export function ClassCodeManager({ initial }: { initial: ClassCode[] }) {
  const router = useRouter();
  const [codes, setCodes] = useState<ClassCode[]>(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  function addCode() {
    const code = prompt("New class code (min 4 characters)")?.trim();
    if (!code) return;
    const label = prompt("Optional label (e.g. 'Primary 3 Monday')")?.trim() || "";
    setError(null);
    start(async () => {
      const res = await fetch("/api/class-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, label: label || undefined }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      const row = (await res.json()) as ClassCode;
      setCodes((prev) => [row, ...prev]);
      refresh();
    });
  }

  function renameCode(c: ClassCode) {
    const next = prompt("Rename class code", c.code)?.trim();
    if (!next || next === c.code) return;
    setError(null);
    start(async () => {
      const res = await fetch(`/api/class-codes/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: next }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      const row = (await res.json()) as ClassCode;
      setCodes((prev) => prev.map((x) => (x.id === c.id ? row : x)));
      refresh();
    });
  }

  function editLabel(c: ClassCode) {
    const next = prompt("Edit label", c.label ?? "") ?? null;
    if (next === null) return;
    setError(null);
    start(async () => {
      const res = await fetch(`/api/class-codes/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: next }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      const row = (await res.json()) as ClassCode;
      setCodes((prev) => prev.map((x) => (x.id === c.id ? row : x)));
      refresh();
    });
  }

  function deleteCode(c: ClassCode) {
    if (
      !confirm(
        `Delete class code "${c.code}"? Students using it will no longer be able to sign in.`
      )
    )
      return;
    setError(null);
    start(async () => {
      const res = await fetch(`/api/class-codes/${c.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      setCodes((prev) => prev.filter((x) => x.id !== c.id));
      refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-600">
          Students need at least one active class code to sign in with a PIN.
        </p>
        <button
          onClick={addCode}
          disabled={pending}
          className="btn-primary text-sm"
        >
          + Add code
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {codes.length === 0 ? (
        <div className="card text-center text-ink-500">
          No class codes yet. Add one to enable PIN sign-in.
        </div>
      ) : (
        <ul className="space-y-3">
          {codes.map((c) => (
            <li key={c.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-lg font-semibold tracking-wide text-ink-900">
                    {c.code}
                  </div>
                  <div className="text-xs text-ink-500">
                    {c.label ?? "No label"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => renameCode(c)}
                    disabled={pending}
                    className="btn-ghost text-xs"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => editLabel(c)}
                    disabled={pending}
                    className="btn-ghost text-xs"
                  >
                    Edit label
                  </button>
                  <button
                    onClick={() => deleteCode(c)}
                    disabled={pending}
                    className="text-xs font-medium text-rose-600 transition hover:text-rose-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
