"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const MAX_RECORD_SECONDS = 30;

export type PlayerScene = {
  id: string;
  subtitle: string;
  imageUrl: string | null;
  audioUrl: string | null;
  studentAudioUrl?: string | null;
};

type Props =
  | { scenes: PlayerScene[]; mode: "preview" }
  | { scenes: PlayerScene[]; mode: "review" }
  | { scenes: PlayerScene[]; mode: "practice"; assignmentId: string };

function pickAudioMime(): { mime: string; ext: string } {
  const candidates: { mime: string; ext: string }[] = [
    { mime: "audio/webm;codecs=opus", ext: "webm" },
    { mime: "audio/webm", ext: "webm" },
    { mime: "audio/mp4;codecs=mp4a.40.2", ext: "m4a" },
    { mime: "audio/mp4", ext: "m4a" },
    { mime: "audio/ogg;codecs=opus", ext: "ogg" },
  ];
  for (const c of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(c.mime)
    ) {
      return c;
    }
  }
  return { mime: "", ext: "webm" };
}

export function StoryPlayer(props: Props) {
  const { scenes, mode } = props;
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [remaining, setRemaining] = useState(MAX_RECORD_SECONDS);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    };
  }, []);

  const scene = scenes[idx];
  const [liveStudentUrl, setLiveStudentUrl] = useState<
    Record<string, string>
  >({});

  const studentUrl = useMemo(
    () => liveStudentUrl[scene?.id] ?? scene?.studentAudioUrl ?? null,
    [liveStudentUrl, scene]
  );

  if (!scene) {
    return (
      <div className="card text-center text-ink-500">No scenes yet.</div>
    );
  }

  async function startRecord() {
    if (mode !== "practice") return;
    setError(null);
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Microphone API unavailable. Use HTTPS or http://localhost."
        );
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const { mime, ext } = pickAudioMime();
      const mr = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onerror = (e) => {
        console.error("MediaRecorder error", e);
        setError("Recorder error — see console.");
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = mr.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        setBusy(true);
        try {
          if (blob.size === 0) throw new Error("Empty recording");
          const filename = `recordings/${props.assignmentId}/${scene.id}-${Date.now()}.${ext}`;
          const res = await upload(filename, blob, {
            access: "public",
            handleUploadUrl: "/api/upload",
            contentType: type,
          });
          const save = await fetch("/api/recordings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assignmentId: props.assignmentId,
              sceneId: scene.id,
              audioUrl: res.url,
            }),
          });
          if (!save.ok) throw new Error(`Save failed: ${await save.text()}`);
          setLiveStudentUrl((m) => ({ ...m, [scene.id]: res.url }));
        } catch (e) {
          console.error(e);
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      };
      recorderRef.current = mr;
      mr.start();
      setRecording(true);
      setRemaining(MAX_RECORD_SECONDS);
      stopTimerRef.current = setTimeout(() => {
        stopRecord();
      }, MAX_RECORD_SECONDS * 1000);
      tickTimerRef.current = setInterval(() => {
        setRemaining((r) => (r > 0 ? r - 1 : 0));
      }, 1000);
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    }
  }

  function stopRecord() {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    try {
      if (recorderRef.current?.state !== "inactive") {
        recorderRef.current?.stop();
      }
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    }
    setRecording(false);
  }

  const progress = ((idx + 1) / scenes.length) * 100;

  return (
    <div className="space-y-5">
      <div className="card space-y-6 p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <span className="badge">
            Scene {idx + 1} of {scenes.length}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100 mx-4">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-ink-500 tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[440px] overflow-hidden rounded-3xl bg-ink-100 shadow-lift ring-1 ring-ink-100">
          {scene.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={scene.imageUrl}
              alt={scene.subtitle}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase tracking-wide text-ink-400">
              image pending
            </div>
          )}
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 via-white to-accent-50 px-6 py-8 ring-1 ring-ink-100">
          <p
            className="text-center font-display leading-[1.1] tracking-tight text-ink-900"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
          >
            {scene.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {scene.audioUrl ? (
            <button
              onClick={() => audioElRef.current?.play()}
              className="btn-primary"
            >
              <span aria-hidden>▶</span> Listen
            </button>
          ) : (
            <span className="badge">audio pending</span>
          )}
          <audio
            ref={audioElRef}
            src={scene.audioUrl ?? undefined}
            preload="none"
          />

          {mode === "practice" &&
            (!recording ? (
              <button
                disabled={busy}
                onClick={startRecord}
                className="btn-danger"
              >
                <span aria-hidden>●</span>
                {busy ? "Uploading…" : "Record"}
              </button>
            ) : (
              <button
                onClick={stopRecord}
                className="inline-flex items-center gap-2 rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-red-800"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                Stop
                <span className="tabular-nums opacity-80">
                  {remaining}s
                </span>
              </button>
            ))}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {(mode === "practice" || mode === "review") && studentUrl && (
          <div className="rounded-2xl border border-ink-100 bg-ink-50/70 p-4">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-500">
              Student's audio
            </div>
            <audio controls src={studentUrl} className="w-full" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="btn-secondary disabled:opacity-40"
        >
          <span aria-hidden>←</span> Previous
        </button>
        <div className="flex gap-1.5">
          {scenes.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Jump to scene ${i + 1}`}
              className={`h-2 w-2 rounded-full transition ${
                i === idx
                  ? "w-6 bg-brand-500"
                  : "bg-ink-200 hover:bg-ink-300"
              }`}
            />
          ))}
        </div>
        {idx === scenes.length - 1 ? (
          <button onClick={() => router.back()} className="btn-primary">
            Exit <span aria-hidden>↩</span>
          </button>
        ) : (
          <button
            onClick={() => setIdx((i) => Math.min(scenes.length - 1, i + 1))}
            className="btn-secondary"
          >
            Next <span aria-hidden>→</span>
          </button>
        )}
      </div>
    </div>
  );
}
