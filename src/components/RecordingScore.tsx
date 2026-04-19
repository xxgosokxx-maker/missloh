type Props = {
  score: number | null | undefined;
  feedback: string | null | undefined;
  transcript: string | null | undefined;
};

const scoreStyle: Record<number, string> = {
  5: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  4: "bg-lime-100 text-lime-800 ring-lime-200",
  3: "bg-amber-100 text-amber-800 ring-amber-200",
  2: "bg-orange-100 text-orange-800 ring-orange-200",
  1: "bg-red-100 text-red-800 ring-red-200",
};

export function RecordingScore({ score, feedback, transcript }: Props) {
  if (score == null) {
    return (
      <div className="mt-2 rounded-2xl border border-dashed border-ink-200 bg-white/60 p-3 text-xs text-ink-500">
        — / 5 · Not yet evaluated
      </div>
    );
  }
  const pill = scoreStyle[score] ?? "bg-ink-100 text-ink-800 ring-ink-200";
  return (
    <div className="mt-2 space-y-2 rounded-2xl border border-ink-100 bg-white/80 p-3">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ring-1 ${pill}`}
        >
          {score} / 5
        </span>
        {feedback && (
          <span className="text-sm text-ink-800">{feedback}</span>
        )}
      </div>
      {transcript && (
        <div className="text-[11px] text-ink-500">
          <span className="font-medium uppercase tracking-wide">Heard: </span>
          <span className="italic">{transcript}</span>
        </div>
      )}
    </div>
  );
}
