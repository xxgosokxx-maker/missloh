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

function languageHints(language: string): string {
  if (/mandarin|chinese|中文/i.test(language)) {
    return "For Mandarin, prioritise tones (1-4 plus neutral). A wrong tone on a content word is a real pronunciation error; initials and finals matter too (zh/ch/sh vs z/c/s, -n vs -ng).";
  }
  if (/french|français/i.test(language)) {
    return "For French, prioritise nasal vowels (on, en, an, un), the French 'r' (uvular), silent final consonants (except with liaison), and liaison between words. Do not penalise accent-free pronunciation of a word spelled without liaison.";
  }
  return "";
}

export type EvaluationResult = {
  score: number;
  accuracy: number;
  clarity: number;
  audible: boolean;
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
  const hints = languageHints(opts.language);
  const prompt = `You are a patient, encouraging pronunciation coach for a child learning ${lang}.
The child is practicing at difficulty ${diff}/9 (${level}).
Target sentence: ${opts.subtitle}

${hints ? `Language focus: ${hints}\n\n` : ""}FIRST decide if the recording is audible enough to grade. If you hear only silence, static, or a few unintelligible noises, set "audible": false and leave transcript empty; still return a score of 1 and a feedback like "Miss Luna couldn't hear you clearly — try recording again in a quieter spot." In that case do not hallucinate a transcript.

If audible, return JSON with all fields filled.

Transcript: write what you actually heard, in the target language's script.

Score TWO separate axes, each an integer 1..5:
- "accuracy" — reading accuracy. Did the child read the target sentence, in order, without skipping or substituting words?
- "clarity" — pronunciation clarity. Are the sounds${isMandarin ? ", tones," : ""} and stress crisp and intelligible?

Also return a combined "score" (integer 1..5). Combined is roughly the lower of the two axes, nudged up by half a step when both are within 1 of each other.

Rubric per axis:
- 5: strong — no notable issues
- 4: minor issues (one small sound off, or one word hedged)
- 3: noticeable issues but the gist comes through
- 2: significant errors — many words missing or large stretches unintelligible
- 1: unintelligible or unrelated

Grade gently for beginners (difficulty 1-3): minor clarity imperfections alone should not drop clarity below 4. Grade more strictly at advanced levels (7-9).

Feedback: ONE warm sentence in English aimed at the child, naming ONE specific ${isMandarin ? "tone, syllable, or sound" : "sound, syllable, or stress pattern"} to work on. Examples of tone: ${isMandarin ? `"the second tone in ni hao should rise — make your voice go up like asking a question"` : `"try the 'th' in 'three' — put your tongue between your teeth and blow softly"`}. CRITICAL: do NOT use IPA phonetic symbols (no /θ/, /ʃ/, /ɑ/, etc.). Spell sounds in plain English letters or use the actual letters from the target word. For Mandarin, refer to syllables in pinyin (without IPA) or in the Chinese script. No vague filler, no "keep trying". If the child read it well, a short warm congratulation naming what they did well is fine.`;

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
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              audible: { type: "boolean" },
              transcript: { type: "string" },
              accuracy: { type: "integer", minimum: 1, maximum: 5 },
              clarity: { type: "integer", minimum: 1, maximum: 5 },
              score: { type: "integer", minimum: 1, maximum: 5 },
              feedback: { type: "string" },
            },
            required: [
              "audible",
              "transcript",
              "accuracy",
              "clarity",
              "score",
              "feedback",
            ],
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
  let parsed: {
    audible?: unknown;
    transcript?: unknown;
    accuracy?: unknown;
    clarity?: unknown;
    score?: unknown;
    feedback?: unknown;
  };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Gemini eval returned non-JSON: ${text.slice(0, 200)}`);
  }
  const clampScore = (v: unknown, field: string): number => {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      throw new Error(`Gemini eval returned invalid ${field}: ${v}`);
    }
    return n;
  };
  const score = clampScore(parsed.score, "score");
  const accuracy = clampScore(parsed.accuracy, "accuracy");
  const clarity = clampScore(parsed.clarity, "clarity");
  const audible = parsed.audible !== false;
  const feedback =
    typeof parsed.feedback === "string" ? parsed.feedback : "";
  const transcript =
    typeof parsed.transcript === "string" ? parsed.transcript : "";
  return { score, accuracy, clarity, audible, feedback, transcript };
}
