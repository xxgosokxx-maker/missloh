"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ART_STYLES, AVATARS, type Avatar } from "@/lib/avatars";
import { Avatar as AvatarView } from "@/components/Avatar";

export function AvatarPicker({
  initialUrl,
  studentName,
}: {
  initialUrl: string | null;
  studentName: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(initialUrl);
  const [pending, setPending] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const byStyle = useMemo(() => {
    const map = new Map<string, Avatar[]>();
    for (const style of ART_STYLES) map.set(style, []);
    for (const a of AVATARS) {
      const list = map.get(a.style);
      if (list) list.push(a);
    }
    return map;
  }, []);

  async function pick(url: string | null) {
    setPending(url ?? "__none__");
    setErr(null);
    try {
      const res = await fetch("/api/me/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSelected(url);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message || "Could not save avatar");
    } finally {
      setPending(null);
    }
  }

  if (AVATARS.length === 0) {
    return (
      <div className="card text-sm text-ink-600">
        No avatars are loaded yet. Ask your teacher to run the avatar generation
        script.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="card flex items-center gap-4">
        <AvatarView url={selected} name={studentName} size="lg" />
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-ink-500">
            Your avatar
          </div>
          <div className="font-display text-xl text-ink-900">
            {selected ? "Looking sharp!" : "Pick one below"}
          </div>
          {selected && (
            <button
              type="button"
              onClick={() => pick(null)}
              disabled={pending !== null}
              className="mt-2 text-xs font-medium text-ink-500 underline-offset-2 hover:text-ink-900 hover:underline disabled:opacity-50"
            >
              Clear avatar
            </button>
          )}
          {err && <div className="mt-2 text-xs text-red-600">{err}</div>}
        </div>
      </div>

      {ART_STYLES.map((style) => {
        const items = byStyle.get(style) ?? [];
        if (items.length === 0) return null;
        return (
          <section key={style}>
            <h3 className="font-display text-lg text-ink-900">{style}</h3>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {items.map((a) => {
                const isSelected = selected === a.url;
                const isPending = pending === a.url;
                return (
                  <li key={a.url}>
                    <button
                      type="button"
                      onClick={() => pick(a.url)}
                      disabled={pending !== null}
                      className={`group relative flex w-full flex-col items-center gap-2 rounded-2xl p-3 text-xs transition disabled:opacity-50 ${
                        isSelected
                          ? "bg-gradient-to-br from-brand-50 to-accent-50 ring-2 ring-brand-400"
                          : "ring-1 ring-ink-100 hover:ring-brand-200"
                      }`}
                    >
                      <img
                        src={a.url}
                        alt=""
                        loading="lazy"
                        className="aspect-square w-full rounded-xl object-cover"
                      />
                      <span className="text-[11px] font-medium text-ink-600">
                        {a.gender === "male" ? "Boy" : "Girl"} {a.index}
                      </span>
                      {isPending && (
                        <span className="absolute inset-0 grid place-items-center rounded-2xl bg-white/60 text-[11px] font-medium text-ink-700">
                          Saving…
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
