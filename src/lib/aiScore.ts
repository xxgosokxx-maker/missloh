import { isOwnBlobUrl } from "@/lib/blob";

const GEMINI_KEY = () => {
  const k = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!k) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  return k;
};
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 3
): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;
      if (res.status < 500 && res.status !== 429) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
  throw lastErr;
}

function languageLabel(language: string): string {
  if (/mandarin|chinese|中文/i.test(language)) {
    return "Mandarin (Traditional Chinese, as used in Taiwan / Hong Kong)";
  }
  return language;
}

export type EvaluationResult = {
  score: number;
  feedback: string;
  transcript: string;
};

export async function evaluateRecording(opts: {
  language: string;
  subtitle: string;
  audioUrl: string;
  difficulty?: number;
}): Promise<EvaluationResult> {
  if (!isOwnBlobUrl(opts.audioUrl)) {
    throw new Error("Recording audio URL is not from our blob host");
  }

  const audioRes = await fetch(opts.audioUrl);
  if (!audioRes.ok) {
    throw new Error(`Recording blob fetch failed: ${audioRes.status}`);
  }
  const mimeType =
    audioRes.headers.get("content-type")?.split(";")[0].trim() || "audio/webm";
  const buf = Buffer.from(await audioRes.arrayBuffer());
  const b64 = buf.toString("base64");

  const lang = languageLabel(opts.language);
  const diff = Math.max(1, Math.min(9, Math.round(opts.difficulty ?? 3)));
  const level = diff <= 3 ? "beginner" : diff <= 6 ? "intermediate" : "advanced";
  const isMandarin = /mandarin|chinese|中文/i.test(opts.language);
  const prompt = `You are a patient, encouraging pronunciation coach for a child learning ${lang}.
The child is practicing at difficulty ${diff}/9 (${level}).
Target sentence: ${opts.subtitle}

Listen carefully and return JSON with fields { "transcript", "score", "feedback" }.

Transcript: write what you actually heard, in the target language's script.

Score on TWO axes, then combine to a single integer 1..5:
- Pronunciation clarity: are the sounds${isMandarin ? ", tones," : ""} and stress crisp and intelligible?
- Reading accuracy: did the child read the target sentence (vs. skipping or substituting words)?

A child who read every word and tried hard on a tricky sound should score well even with a small mispronunciation. A child who skipped half the words should score low even if each spoken word was perfectly pronounced.

Combined rubric (integer 1..5):
- 5: both axes strong — all words read, sounds clear and natural
- 4: one axis strong, the other has minor imperfections (e.g. all words read with one sound slightly off)
- 3: noticeable issues on one or both axes, but the gist comes through
- 2: significant errors — many words missing or large stretches unintelligible
- 1: unintelligible or unrelated to the target sentence

Grade gently for beginners (difficulty 1-3): minor pronunciation imperfections on tricky sounds alone should not drop below 4. Grade more strictly at advanced levels (7-9).

Feedback: ONE sentence in English aimed at the child, naming ONE specific ${isMandarin ? "tone, syllable, or sound" : "sound, syllable, or stress pattern"} to work on (e.g. ${isMandarin ? `"the second tone in 你好 should rise — make your voice go up"` : `"try the /θ/ in 'three' — put your tongue between your teeth"`}). No vague filler, no "keep trying". If the child read it well, a short warm congratulation naming what they did well is fine.`;

  const res = await fetchWithRetry(
    `${GEMINI_BASE}/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { mimeType, data: b64 } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              transcript: { type: "string" },
              score: { type: "integer", minimum: 1, maximum: 5 },
              feedback: { type: "string" },
            },
            required: ["transcript", "score", "feedback"],
          },
        },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Gemini eval failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as {
    promptFeedback?: { blockReason?: string };
    candidates?: {
      finishReason?: string;
      content?: { parts?: { text?: string }[] };
    }[];
  };
  const blockReason = json.promptFeedback?.blockReason;
  if (blockReason) throw new Error(`Gemini eval blocked: ${blockReason}`);
  const text = json.candidates?.[0]?.content?.parts
    ?.map((p) => p.text)
    .filter(Boolean)
    .join("");
  if (!text) {
    const finish = json.candidates?.[0]?.finishReason;
    throw new Error(
      `Gemini eval returned no text${finish ? ` (finishReason=${finish})` : ""}`
    );
  }
  let parsed: { transcript?: unknown; score?: unknown; feedback?: unknown };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Gemini eval returned non-JSON: ${text.slice(0, 200)}`);
  }
  const score = Number(parsed.score);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error(`Gemini eval returned invalid score: ${parsed.score}`);
  }
  const feedback =
    typeof parsed.feedback === "string" ? parsed.feedback : "";
  const transcript =
    typeof parsed.transcript === "string" ? parsed.transcript : "";
  return { score, feedback, transcript };
}
