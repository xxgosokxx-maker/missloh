import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
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
  scenes: z.array(SceneSchema).min(3).max(10),
});

export type GenerateStoryInput = {
  title: string;
  description: string;
  difficulty: number;
  language: string;
  imageStyle: string;
};

const GEMINI_KEY = () => {
  const k = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!k) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  return k;
};
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export async function generateStoryScenes(input: GenerateStoryInput) {
  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: StorySchema,
    prompt: `You are a language-learning picture book author.
Write a short picture book for a student learning ${input.language}.

Title: ${input.title}
Description: ${input.description}
Difficulty (1 easiest, 5 hardest): ${input.difficulty}

Return 5-7 scenes. Each scene has:
- subtitle: one sentence the student will read aloud, IN ${input.language}, matched to difficulty level
- imagePrompt: a vivid visual scene description in English, with the art style "${input.imageStyle}" woven in`,
  });
  return object.scenes;
}

export async function generateSceneImage(
  imagePrompt: string,
  imageStyle: string,
  pathname: string
): Promise<string> {
  const res = await fetch(
    `${GEMINI_BASE}/models/imagen-3.0-generate-002:predict?key=${GEMINI_KEY()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [
          {
            prompt: `${imagePrompt}. Art style: ${imageStyle}. Children's picture book illustration.`,
          },
        ],
        parameters: { sampleCount: 1, aspectRatio: "1:1" },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Imagen failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as {
    predictions?: { bytesBase64Encoded?: string }[];
  };
  const b64 = json.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error("Imagen returned no image");
  return uploadBlob(pathname, Buffer.from(b64, "base64"), "image/png");
}

export async function generateSceneAudio(
  subtitle: string,
  pathname: string
): Promise<string> {
  const res = await fetch(
    `${GEMINI_BASE}/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_KEY()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: subtitle }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
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
