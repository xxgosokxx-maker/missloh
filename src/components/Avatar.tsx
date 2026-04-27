import { displayName } from "@/lib/names";

type Size = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-24 w-24 text-2xl",
};

export function Avatar({
  url,
  name,
  size = "md",
  className = "",
}: {
  url: string | null | undefined;
  name: string | null | undefined;
  size?: Size;
  className?: string;
}) {
  const cls = `${SIZE_CLASSES[size]} flex-none rounded-full ${className}`;
  if (url) {
    return (
      <span
        className={`${cls} relative inline-block overflow-hidden ring-1 ring-ink-200`}
      >
        <img
          src={url}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: "scale(1.35)", transformOrigin: "50% 30%" }}
        />
      </span>
    );
  }
  const initial =
    displayName(name).charAt(0).toUpperCase() || "·";
  return (
    <span
      aria-hidden
      className={`${cls} grid place-items-center bg-gradient-to-br from-accent-300 to-brand-400 font-semibold text-white shadow-soft`}
    >
      {initial}
    </span>
  );
}
