type Props = {
  score: number | null | undefined;
  accuracy?: number | null;
  clarity?: number | null;
  feedback: string | null | undefined;
  transcript: string | null | undefined;
  coach?: string;
};

const scoreStyle: Record<number, string> = {
  5: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  4: "bg-lime-100 text-lime-800 ring-lime-200",
  3: "bg-amber-100 text-amber-800 ring-amber-200",
  2: "bg-orange-100 text-orange-800 ring-orange-200",
  1: "bg-red-100 text-red-800 ring-red-200",
};

function CoachByline({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-brand-700">
      <span aria-hidden>🎓</span>
      <span>{name}</span>
    </div>
  );
}

function SubScore({ label, value }: { label: string; value: number }) {
  const pill = scoreStyle[value] ?? "bg-ink-100 text-ink-800 ring-ink-200";
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-ink-600">
      <span className="font-medium uppercase tracking-wide">{label}</span>
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ring-1 ${pill}`}
      >
        {value}/5
      </span>
    </span>
  );
}

export function RecordingScore({
  score,
  accuracy,
  clarity,
  feedback,
  transcript,
  coach,
}: Props) {
  if (score == null) {
    return (
      <div className="mt-2 space-y-1 rounded-2xl border border-dashed border-ink-200 bg-white/60 p-3 text-xs text-ink-500">
        {coach && <CoachByline name={coach} />}
        <div>— / 5 · Not yet evaluated</div>
      </div>
    );
  }
  const pill = scoreStyle[score] ?? "bg-ink-100 text-ink-800 ring-ink-200";
  return (
    <div className="mt-2 space-y-2 rounded-2xl border border-ink-100 bg-white/80 p-3">
      {coach && <CoachByline name={coach} />}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ring-1 ${pill}`}
        >
          {score} / 5
        </span>
        {feedback && (
          <span className="text-sm text-ink-800">{feedback}</span>
        )}
      </div>
      {(accuracy != null || clarity != null) && (
        <div className="flex flex-wrap items-center gap-3">
          {accuracy != null && <SubScore label="Accuracy" value={accuracy} />}
          {clarity != null && <SubScore label="Clarity" value={clarity} />}
        </div>
      )}
      {transcript && (
        <div className="text-[11px] text-ink-500">
          <span className="font-medium uppercase tracking-wide">Heard: </span>
          <span className="italic">{transcript}</span>
        </div>
      )}
    </div>
  );
}
