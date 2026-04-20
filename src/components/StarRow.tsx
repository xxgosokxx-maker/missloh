import { useId } from "react";

export function StarRow({
  value,
  size = 14,
}: {
  value: number | null | undefined;
  size?: number;
}) {
  const gradId = useId();
  const v = value ?? 0;
  return (
    <div className="flex items-center gap-0.5" aria-label={`${v} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const full = v >= n;
        const half = !full && v >= n - 0.5;
        const gradientId = `${gradId}-row-${n}`;
        const fill = full
          ? "#efbb24"
          : half
            ? `url(#${gradientId})`
            : "#d9d5cc";
        return (
          <svg
            key={n}
            width={size}
            height={size}
            viewBox="0 0 20 20"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
                <stop offset="50%" stopColor="#efbb24" />
                <stop offset="50%" stopColor="#d9d5cc" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.8l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 15.1l-5.2 2.7 1-5.8L1.6 7.9l5.8-.8L10 1.8z"
              fill={fill}
            />
          </svg>
        );
      })}
    </div>
  );
}
