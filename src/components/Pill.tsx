import type { ReactNode } from "react";

type Tone = "neutral" | "amber";

const toneClasses: Record<Tone, string> = {
  neutral: "border-ink-200 bg-white/80 text-ink-600",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
};

export function Pill({
  children,
  tone = "neutral",
  size = "sm",
}: {
  children: ReactNode;
  tone?: Tone;
  size?: "sm" | "xs";
}) {
  const sizeClass =
    size === "xs" ? "px-1.5 py-0 text-[10px]" : "px-2.5 py-0.5 text-[11px]";
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium uppercase tracking-wide ${sizeClass} ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
