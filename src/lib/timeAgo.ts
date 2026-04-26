export function timeAgo(when: Date | null | undefined, now: Date = new Date()): string {
  if (!when) return "never";
  const diff = now.getTime() - when.getTime();
  if (diff < 0) return "just now";
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) {
    const m = Math.floor(diff / minute);
    return `${m}m ago`;
  }
  if (diff < day) {
    const h = Math.floor(diff / hour);
    return `${h}h ago`;
  }
  if (diff < 7 * day) {
    const d = Math.floor(diff / day);
    return `${d}d ago`;
  }
  if (diff < 30 * day) {
    const w = Math.floor(diff / (7 * day));
    return `${w}w ago`;
  }
  return when.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
