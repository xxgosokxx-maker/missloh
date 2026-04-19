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
  const prompt = `You are grading a child's pronunciation practice.
Target language: ${lang}.
Target sentence: ${opts.subtitle}
Listen to the recording and return JSON with fields { "transcript", "score", "feedback" }.
Score rubric (integer 1..5):
- 5: word-accurate and clearly pronounced
- 4: understandable, minor mispronunciations or hesitation
- 3: most words right, some noticeable errors
- 2: partial match, significant errors or missing words
- 1: unintelligible or unrelated to the target sentence
Feedback: ONE sentence in English, aimed at the student, naming a concrete fix (e.g. a specific sound or word). No filler, no "keep trying". If the student read the sentence perfectly, a short congratulatory sentence is fine.
Transcript: write what you actually heard, in the target language's script.`;

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
