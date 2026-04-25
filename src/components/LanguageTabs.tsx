"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export type LanguageTab = { language: string; count: number };

export function LanguageTabs({
  tabs,
  active,
}: {
  tabs: LanguageTab[];
  active: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  function setLang(language: string) {
    const q = new URLSearchParams(params.toString());
    q.set("lang", language);
    start(() => router.replace(`${pathname}?${q.toString()}`));
  }

  return (
    <div
      role="tablist"
      aria-label="Story language"
      className="flex flex-wrap items-center gap-1 rounded-full border border-ink-100 bg-white/60 p-1 backdrop-blur-sm"
    >
      {tabs.map((tab) => {
        const isActive = tab.language === active;
        return (
          <button
            key={tab.language}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setLang(tab.language)}
            disabled={pending && isActive}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              isActive
                ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-soft"
                : "text-ink-600 hover:bg-white hover:text-ink-900"
            }`}
          >
            <span>{tab.language}</span>
            <span
              className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-ink-100 text-ink-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
