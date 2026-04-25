import { displayName } from "@/lib/names";

export type LeaderboardRow = {
  studentId: string;
  name: string | null;
  stars: number;
};

export function Leaderboard({
  rows,
  meId,
  emptyLabel = "No stars yet.",
}: {
  rows: LeaderboardRow[];
  meId?: string;
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-xs text-ink-500">{emptyLabel}</p>;
  }
  return (
    <ol className="space-y-2">
      {rows.map((row, i) => {
        const isMe = !!meId && row.studentId === meId;
        const stars = Number(row.stars) || 0;
        return (
          <li
            key={row.studentId}
            className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition ${
              isMe
                ? "bg-gradient-to-br from-brand-50 to-accent-50 ring-1 ring-brand-200"
                : "hover:bg-ink-50"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`grid h-6 w-6 flex-none place-items-center rounded-full text-[11px] font-semibold ${
                  i === 0
                    ? "bg-accent-400 text-ink-900"
                    : i === 1
                      ? "bg-ink-200 text-ink-800"
                      : i === 2
                        ? "bg-brand-200 text-brand-800"
                        : "bg-ink-100 text-ink-600"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`truncate ${
                  isMe ? "font-semibold text-ink-900" : "text-ink-700"
                }`}
              >
                {displayName(row.name)}
              </span>
            </div>
            <span className="flex flex-none items-center gap-1 text-xs font-medium text-ink-700 tabular-nums">
              {stars}
              <span className="text-accent-500" aria-hidden>
                ★
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
