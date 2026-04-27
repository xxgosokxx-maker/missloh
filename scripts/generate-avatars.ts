/**
 * One-time avatar generator. Run with:
 *
 *     bunx --bun scripts/generate-avatars.ts
 *
 * Calls Gemini 2.5 Flash Image 60 times (15 styles x 2 genders x 2 indices),
 * uploads each result to Vercel Blob, and prints a TypeScript array literal
 * you paste into the AVATARS export in src/lib/avatars.ts.
 *
 * Required env (loaded from .env via dotenv):
 *   GOOGLE_GENERATIVE_AI_API_KEY
 *   BLOB_READ_WRITE_TOKEN
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { renderAvatarImage, uploadRenderedImage } from "@/lib/ai";
import {
  ART_STYLES,
  styleSlug,
  type ArtStyle,
  type AvatarGender,
  type AvatarIndex,
} from "@/lib/avatars";

type Result = {
  style: ArtStyle;
  gender: AvatarGender;
  index: AvatarIndex;
  url: string;
};

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateOne(
  style: ArtStyle,
  gender: AvatarGender,
  index: AvatarIndex
): Promise<Result> {
  const img = await renderAvatarImage({ style, gender, index });
  const slug = styleSlug(style);
  const pathname = `avatars/${slug}/${gender}-${index}.webp`;
  const url = await uploadRenderedImage(img, pathname);
  return { style, gender, index, url };
}

async function main() {
  const results: Result[] = [];
  const failures: { style: ArtStyle; gender: AvatarGender; index: AvatarIndex; error: string }[] = [];

  let n = 0;
  const total = ART_STYLES.length * 4;

  for (const style of ART_STYLES) {
    for (const gender of ["male", "female"] as const) {
      for (const index of [1, 2] as const) {
        n++;
        const label = `[${n}/${total}] ${style} ${gender} ${index}`;
        try {
          const r = await generateOne(style, gender, index);
          console.log(`${label} -> ${r.url}`);
          results.push(r);
        } catch (e) {
          const msg = (e as Error).message;
          console.error(`${label} FAILED: ${msg}`);
          failures.push({ style, gender, index, error: msg });
        }
        await sleep(1500);
      }
    }
  }

  console.log("\n--- Paste into AVATARS in src/lib/avatars.ts ---\n");
  console.log("export const AVATARS: readonly Avatar[] = [");
  for (const r of results) {
    console.log(
      `  { url: ${JSON.stringify(r.url)}, style: ${JSON.stringify(r.style)}, gender: ${JSON.stringify(r.gender)}, index: ${r.index} },`
    );
  }
  console.log("];");

  if (failures.length > 0) {
    console.log(`\n${failures.length} failure(s):`);
    for (const f of failures) {
      console.log(`  ${f.style} ${f.gender} ${f.index}: ${f.error}`);
    }
    console.log("Re-run the script to retry — successful URLs are already uploaded.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
