# Miss Loh Tutoring

AI-powered picture-book language-learning app. Teachers generate stories with
native TTS + AI art, assign them to students, and review students' voice
recordings.

Stack: **Next.js 14 (App Router) · Drizzle ORM · Neon Postgres · NextAuth v5 (Google-only) · Vercel Blob · Vercel AI SDK (Google Gemini)**

## Setup

1. Install
   ```bash
   npm install
   ```
2. Copy env and fill values
   ```bash
   cp .env.example .env.local
   ```
   You need:
   - `DATABASE_URL` — Neon connection string (with `?sslmode=require`)
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth client
     (redirect URI: `http://localhost:3000/api/auth/callback/google`)
   - `BLOB_READ_WRITE_TOKEN` — Vercel Blob token
   - `GOOGLE_GENERATIVE_AI_API_KEY` — used for text (Gemini 2.5 Flash), images (Imagen 3), and TTS (Gemini 2.5 Flash TTS). Get one at https://aistudio.google.com/apikey
3. Push schema
   ```bash
   npm run db:push
   ```
4. Run
   ```bash
   npm run dev
   ```

## Auth

Only **Google Sign-In** is enabled (see `src/lib/auth.ts`). On first sign-in
the user lands on `/onboarding` to pick their role (teacher or student).
Middleware gates `/teacher/**` and `/student/**` accordingly.

## Data model

See `src/lib/db/schema.ts`. All foreign keys use `ON DELETE CASCADE`, so
deleting a story wipes its scenes, assignments, and recordings in one go.

## Key routes

| Route | Purpose |
| --- | --- |
| `/` | Landing / auto-redirect |
| `/auth/signin` | Google sign-in |
| `/onboarding` | One-time role picker |
| `/teacher` | Stories tab (generate/list/delete) |
| `/teacher/students` | Assign & review |
| `/teacher/students/[studentId]/story/[storyId]` | Review student's recordings |
| `/student` | Assigned stories |
| `/student/story/[id]` | Read + record |

## AI pipeline

`POST /api/stories` →
1. `generateObject` on `gemini-2.5-flash` with Zod → 5–7 scenes (subtitle + imagePrompt)
2. Per scene, in parallel: Imagen 3 (`imagen-3.0-generate-002:predict`) + Gemini TTS (`gemini-2.5-flash-preview-tts`, PCM wrapped to WAV)
3. Upload each asset to Vercel Blob, save URL to Postgres

## Recordings

The browser records webm via `MediaRecorder`, uploads directly to Vercel Blob
via `@vercel/blob/client` + the `/api/upload` token route, then POSTs the URL
to `/api/recordings` which upserts by `(assignment_id, scene_id)`.
