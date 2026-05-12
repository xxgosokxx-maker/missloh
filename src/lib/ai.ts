import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import sharp from "sharp";
import { z } from "zod";
import { uploadBlob } from "@/lib/blob";

const SceneSchema = z.object({
  subtitle: z
    .string()
    .describe(
      "The text the student reads aloud for this scene, written in the target language"
    ),
  imagePrompt: z
    .string()
    .describe("A short, vivid visual prompt describing this scene"),
});

const StorySchema = z.object({
  characters: z
    .string()
    .describe(
      "Character bible: 1-3 sentences in English describing the recurring characters' species, body shape, colors, hair, clothing, and distinctive features. Every scene's illustration will reference this to keep characters consistent."
    ),
  scenes: z.array(SceneSchema).min(3).max(10),
});

const SubtitleListSchema = z.object({
  subtitles: z.array(z.string()),
});

export type StoryLevel = 1 | 2 | 3;

export function clampLevel(value: unknown): StoryLevel {
  const n = Math.round(Number(value));
  if (n <= 1) return 1;
  if (n >= 3) return 3;
  return 2;
}

export type GenerateStoryInput = {
  title: string;
  description: string;
  difficulty: number;
  language: string;
  imageStyle: string;
};

function languageLabel(language: string): string {
  if (/mandarin|chinese|中文/i.test(language)) {
    return "Traditional Chinese (繁體中文, as used in Taiwan / Hong Kong — NOT Simplified Chinese)";
  }
  return language;
}

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

export async function generateStoryScenes(input: GenerateStoryInput) {
  const lang = languageLabel(input.language);
  const level = clampLevel(input.difficulty);
  const { object } = await generateObject({
    model: google("gemini-3.1-flash-lite"),
    schema: StorySchema,
    prompt: `You are a language-learning picture book author.
Write a short picture book for a student learning ${lang}.

Title: ${input.title}
Description: ${input.description}
Difficulty (1 = beginner, 3 = advanced near-native): ${level}
- Level 1: very short sentences, present tense, high-frequency vocabulary only
- Level 2: compound sentences, common past/future tenses, everyday vocabulary
- Level 3: longer sentences, varied tenses and connectors, richer vocabulary and idiom

Return a character bible AND 5-7 scenes.

- characters: 1-3 sentences describing the recurring characters' species, colors, clothing, hair, and distinctive features. These will be illustrated consistently across every scene.
- scenes[].subtitle: one sentence the student will read aloud, IN ${lang}, matched to difficulty level. For Chinese: use ONLY Traditional characters (e.g. 學, 愛, 們, 說, 買) — never Simplified (e.g. 学, 爱, 们, 说, 买).
- scenes[].imagePrompt: a vivid visual scene description in English. Describe WHAT the characters are doing and WHERE — do NOT re-describe the characters themselves (the bible handles that). Mention art style "${input.imageStyle}".`,
  });
  return object;
}

export async function regenerateSubtitles(opts: {
  title: string;
  description: string;
  language: string;
  difficulty: number;
  imagePrompts: string[];
}): Promise<string[]> {
  const lang = languageLabel(opts.language);
  const level = clampLevel(opts.difficulty);
  const { object } = await generateObject({
    model: google("gemini-3.1-flash-lite"),
    schema: SubtitleListSchema,
    prompt: `You are remixing an existing picture book into ${lang} for a student at difficulty ${level} (1 = beginner, 3 = advanced near-native).
- Level 1: very short sentences, present tense, high-frequency vocabulary only
- Level 2: compound sentences, common past/future tenses, everyday vocabulary
- Level 3: longer sentences, varied tenses and connectors, richer vocabulary and idiom

The original story stays the same visually. You MUST return exactly ${opts.imagePrompts.length} subtitles, one per scene, in order, each written IN ${lang}. For Chinese: use ONLY Traditional characters (e.g. 學, 愛, 們, 說, 買) — never Simplified (e.g. 学, 爱, 们, 说, 买).

Title: ${opts.title}
Description: ${opts.description}

Scenes (each will keep its existing illustration):
${opts.imagePrompts.map((p, i) => `${i + 1}. ${p}`).join("\n")}`,
  });
  if (object.subtitles.length !== opts.imagePrompts.length) {
    throw new Error(
      `Expected ${opts.imagePrompts.length} subtitles, got ${object.subtitles.length}`
    );
  }
  return object.subtitles;
}

export type RenderedImage = { data: string; mime: string };

const IMAGE_MAX_DIMENSION = 1024;
const WEBP_QUALITY = 80;
const RENDERED_IMAGE_MIME = "image/webp";

export async function renderSceneImage(opts: {
  imagePrompt: string;
  imageStyle: string;
  characters: string;
  referenceImage?: RenderedImage;
}): Promise<RenderedImage> {
  const NO_TEXT_RULE =
    "STRICT RULE: the image must contain ZERO written text of any kind. No letters, words, numbers, captions, titles, speech bubbles, thought bubbles, signs, shop names, book covers, street signs, labels, logos, watermarks, or signatures. If a sign or book naturally appears in the scene, render it blank or with abstract patterns — never with readable characters.";

  const textPart = opts.referenceImage
    ? `Generate a NEW illustration for the next page of a children's picture book. This is a DIFFERENT scene from the reference image — do NOT copy or return the reference image. Use the reference ONLY as a style guide for character designs, faces, body proportions, clothing colors, line work, and art style.
Art style: ${opts.imageStyle}.
Characters (keep them visually consistent with the reference): ${opts.characters}
New scene to illustrate (this is what must be drawn, it is different from the reference): ${opts.imagePrompt}
Produce a single new illustration showing the new scene above, no panels, no borders.
${NO_TEXT_RULE}`
    : `Generate the opening page of a children's picture book as a single illustration.
Art style: ${opts.imageStyle}.
Characters (draw them consistently so later pages can reference this image): ${opts.characters}
Scene: ${opts.imagePrompt}
Produce a single illustration, no panels, no borders.
${NO_TEXT_RULE}`;

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [];
  if (opts.referenceImage) {
    parts.push({
      inlineData: {
        mimeType: opts.referenceImage.mime,
        data: opts.referenceImage.data,
      },
    });
  }
  parts.push({ text: textPart });

  const SAFETY_OFF = [
    "HARM_CATEGORY_HARASSMENT",
    "HARM_CATEGORY_HATE_SPEECH",
    "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    "HARM_CATEGORY_DANGEROUS_CONTENT",
    "HARM_CATEGORY_CIVIC_INTEGRITY",
  ].map((category) => ({ category, threshold: "BLOCK_ONLY_HIGH" }));

  const res = await fetchWithRetry(
    `${GEMINI_BASE}/models/gemini-3.1-flash-image-preview:generateContent?key=${GEMINI_KEY()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseModalities: ["IMAGE"] },
        safetySettings: SAFETY_OFF,
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Gemini image failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as {
    promptFeedback?: {
      blockReason?: string;
      safetyRatings?: { category: string; probability: string }[];
    };
    candidates?: {
      finishReason?: string;
      safetyRatings?: { category: string; probability: string }[];
      content?: {
        parts?: {
          text?: string;
          inlineData?: { data?: string; mimeType?: string };
        }[];
      };
    }[];
  };

  const candidate = json.candidates?.[0];
  const resParts = candidate?.content?.parts ?? [];
  const imgPart = resParts.find((p) => p.inlineData?.data)?.inlineData;
  if (imgPart?.data) {
    return { data: imgPart.data, mime: imgPart.mimeType ?? "image/png" };
  }

  const blockReason = json.promptFeedback?.blockReason;
  const finishReason = candidate?.finishReason;
  const blockedRatings = [
    ...(json.promptFeedback?.safetyRatings ?? []),
    ...(candidate?.safetyRatings ?? []),
  ]
    .filter((r) => r.probability && r.probability !== "NEGLIGIBLE")
    .map((r) => `${r.category}=${r.probability}`);
  const textReply = resParts
    .map((p) => p.text)
    .filter(Boolean)
    .join(" ")
    .slice(0, 300);

  const bits = [
    blockReason && `blockReason=${blockReason}`,
    finishReason && `finishReason=${finishReason}`,
    blockedRatings.length && `ratings=[${blockedRatings.join(",")}]`,
    textReply && `text="${textReply}"`,
  ].filter(Boolean);

  throw new Error(
    `Gemini image returned no image data${bits.length ? ` (${bits.join(" ")})` : ""}`
  );
}

export async function renderAvatarImage(opts: {
  style: string;
  gender: "male" | "female";
  index: number;
}): Promise<RenderedImage> {
  const NO_TEXT_RULE =
    "STRICT RULE: the image must contain ZERO written text of any kind. No letters, words, numbers, captions, signs, labels, logos, watermarks, or signatures.";

  const childWord = opts.gender === "male" ? "boy" : "girl";
  const textPart = `Generate a single character portrait avatar for a children's language-learning app.
Art style: ${opts.style}.
Subject: a friendly, kind-looking ${childWord} aged about 8, head-and-shoulders portrait, looking towards the camera with a warm smile.
Composition: square framing, the character centered and clearly visible, simple soft pastel background (no scenery, no props, no other characters).
Variation seed ${opts.index}: make this distinct from other variants — different hair colour/style, skin tone, and outfit colour.
Vibrant but soft colours suitable for kids. No panels, no borders, no frames.
${NO_TEXT_RULE}`;

  const SAFETY_OFF = [
    "HARM_CATEGORY_HARASSMENT",
    "HARM_CATEGORY_HATE_SPEECH",
    "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    "HARM_CATEGORY_DANGEROUS_CONTENT",
    "HARM_CATEGORY_CIVIC_INTEGRITY",
  ].map((category) => ({ category, threshold: "BLOCK_ONLY_HIGH" }));

  const res = await fetchWithRetry(
    `${GEMINI_BASE}/models/gemini-3.1-flash-image-preview:generateContent?key=${GEMINI_KEY()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: textPart }] }],
        generationConfig: { responseModalities: ["IMAGE"] },
        safetySettings: SAFETY_OFF,
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Gemini avatar failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as {
    candidates?: {
      content?: {
        parts?: { inlineData?: { data?: string; mimeType?: string } }[];
      };
    }[];
  };
  const part = json.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.data
  )?.inlineData;
  if (!part?.data) {
    throw new Error("Gemini avatar returned no image data");
  }
  return { data: part.data, mime: part.mimeType ?? "image/png" };
}

export async function uploadRenderedImage(
  img: RenderedImage,
  pathname: string
): Promise<string> {
  const raw = Buffer.from(img.data, "base64");
  const webp = await sharp(raw)
    .resize(IMAGE_MAX_DIMENSION, IMAGE_MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  return uploadBlob(pathname, webp, RENDERED_IMAGE_MIME);
}

export type VoiceGender = "male" | "female";

function voiceName(gender: VoiceGender): string {
  // Gemini prebuilt voices, picked for warm storytelling cadence:
  //   Aoede (female, breezy/warm), Charon (male, clear narrator).
  return gender === "male" ? "Charon" : "Aoede";
}

function ttsStyleInstruction(language: string, level: StoryLevel): string {
  if (/mandarin|chinese|中文/i.test(language)) {
    if (level === 1) {
      return "請以溫暖、緩慢、清晰的兒童故事書朗讀語氣朗讀下面這句話，語速明顯放慢，每個字都咬字清楚，並在標點符號處明顯停頓，方便初學者跟讀：";
    }
    if (level === 3) {
      return "請以溫暖、輕快活潑的兒童故事書朗讀語氣朗讀下面這句話，語速比平常稍快但仍然清楚自然，在標點符號處自然停頓：";
    }
    return "請以溫暖、自然的兒童故事書朗讀語氣朗讀下面這句話，語速自然平穩，咬字清晰，並在標點符號處自然停頓：";
  }
  if (/french|français|francais/i.test(language)) {
    if (level === 1) {
      return "Lis chaleureusement et lentement, comme un instituteur qui raconte un livre d'images à un enfant tout débutant. Articule très clairement chaque syllabe et marque des pauses nettes aux virgules et aux points :";
    }
    if (level === 3) {
      return "Lis chaleureusement et avec entrain, comme un instituteur qui raconte un livre d'images à un enfant déjà à l'aise. Garde un rythme léger et un peu plus vif que la normale tout en restant clair, en marquant des pauses naturelles aux virgules et aux points :";
    }
    return "Lis chaleureusement, comme un instituteur qui raconte un livre d'images à un enfant débutant, à un rythme naturel et régulier, en articulant clairement et en marquant des pauses naturelles aux virgules et aux points :";
  }
  if (level === 1) {
    return "Read aloud slowly and warmly, like a teacher narrating a children's picture book to a brand-new beginner. Articulate every syllable clearly and pause distinctly at commas and periods so the child can follow along:";
  }
  if (level === 3) {
    return "Read aloud warmly and with a light, upbeat pace, like a teacher narrating a children's picture book to a confident young reader. Keep it crisp and a touch quicker than normal, still clear, and pause naturally at commas and periods:";
  }
  return "Read aloud warmly and at a natural, steady pace, like a teacher narrating a children's picture book. Articulate clearly and pause naturally at commas and periods:";
}

export async function generateSceneAudio(
  subtitle: string,
  pathname: string,
  language: string,
  level: StoryLevel,
  gender: VoiceGender = "female"
): Promise<string> {
  const styled = `${ttsStyleInstruction(language, level)}\n\n${subtitle}`;
  const res = await fetchWithRetry(
    `${GEMINI_BASE}/models/gemini-3.1-flash-tts-preview:generateContent?key=${GEMINI_KEY()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: styled }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName(gender) },
            },
          },
        },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Gemini TTS failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as {
    candidates?: {
      content?: {
        parts?: { inlineData?: { data?: string; mimeType?: string } }[];
      };
    }[];
  };
  const part = json.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!part?.data) throw new Error("Gemini TTS returned no audio");
  const pcm = Buffer.from(part.data, "base64");
  const rate = parseSampleRate(part.mimeType ?? "") ?? 24000;
  const wav = pcmToWav(pcm, rate);
  return uploadBlob(pathname, wav, "audio/wav");
}

function parseSampleRate(mime: string): number | null {
  const m = /rate=(\d+)/.exec(mime);
  return m ? Number(m[1]) : null;
}

// Gemini TTS returns raw 16-bit PCM; wrap in a WAV container so browsers can play it.
function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}
