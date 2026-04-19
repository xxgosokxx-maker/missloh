"use client";

import { upload } from "@vercel/blob/client";
import { useMemo, useRef, useState } from "react";

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

export function StoryPlayer(props: Props) {
  const { scenes, mode } = props;
  const [idx, setIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const scene = scenes[idx];
  const [liveStudentUrl, setLiveStudentUrl] = useState<
    Record<string, string>
  >({});

  const studentUrl = useMemo(
    () => liveStudentUrl[scene?.id] ?? scene?.studentAudioUrl ?? null,
    [liveStudentUrl, scene]
  );

  if (!scene) return <p className="text-slate-500">No scenes yet.</p>;

  async function startRecord() {
    if (mode !== "practice") return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setBusy(true);
      try {
        const filename = `recordings/${props.assignmentId}/${scene.id}-${Date.now()}.webm`;
        const res = await upload(filename, blob, {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: "audio/webm",
        });
        await fetch("/api/recordings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignmentId: props.assignmentId,
            sceneId: scene.id,
            audioUrl: res.url,
          }),
        });
        setLiveStudentUrl((m) => ({ ...m, [scene.id]: res.url }));
      } finally {
        setBusy(false);
      }
    };
    recorderRef.current = mr;
    mr.start();
    setRecording(true);
  }

  function stopRecord() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="aspect-square w-full bg-slate-100">
          {scene.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={scene.imageUrl}
              alt={scene.subtitle}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              image pending
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-lg leading-relaxed">{scene.subtitle}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {scene.audioUrl ? (
              <button
                onClick={() => audioElRef.current?.play()}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
              >
                ▶ Listen
              </button>
            ) : (
              <span className="text-xs text-slate-400">audio pending</span>
            )}
            <audio
              ref={audioElRef}
              src={scene.audioUrl ?? undefined}
              preload="none"
            />

            {mode === "practice" && (
              <>
                {!recording ? (
                  <button
                    disabled={busy}
                    onClick={startRecord}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    ● {busy ? "Uploading…" : "Record"}
                  </button>
                ) : (
                  <button
                    onClick={stopRecord}
                    className="rounded-md bg-red-800 px-3 py-2 text-sm text-white"
                  >
                    ■ Stop
                  </button>
                )}
              </>
            )}
          </div>

          {(mode === "practice" || mode === "review") && studentUrl && (
            <div className="mt-4">
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                Student's audio
              </div>
              <audio controls src={studentUrl} className="w-full" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="rounded-md border px-3 py-2 text-sm disabled:opacity-40"
        >
          ← Previous
        </button>
        <div className="text-sm text-slate-500">
          Scene {idx + 1} of {scenes.length}
        </div>
        <button
          onClick={() => setIdx((i) => Math.min(scenes.length - 1, i + 1))}
          disabled={idx === scenes.length - 1}
          className="rounded-md border px-3 py-2 text-sm disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
