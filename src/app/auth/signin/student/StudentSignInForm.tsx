"use client";

import { useState, useTransition } from "react";
import { studentSignInAction } from "./actions";

export function StudentSignInForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const result = await studentSignInAction(null, formData);
      if (result && result.ok === false) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-ink-600">
          Class code
        </label>
        <input
          name="classCode"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          required
          className="input mt-1.5 w-full text-lg"
          placeholder="e.g. class-2026"
        />
      </div>
      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-ink-600">
          Your PIN
        </label>
        <input
          name="pin"
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          autoComplete="off"
          required
          className="input mt-1.5 w-full text-center font-mono text-3xl tracking-[0.4em]"
          placeholder="······"
        />
      </div>
      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full justify-center text-base"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
