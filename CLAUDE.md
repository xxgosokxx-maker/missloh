# Miss Loh's Language Master — Architecture Reference

An AI-powered language-learning web app: teachers generate bilingual picture-book stories with native-voice narration, assign them to students, and use AI to score the students' pronunciation practice.

---

## 1. App Overview

**Roles:** `teacher` or `student`.

**Core loop:**
1. Teacher generates (or uploads, or remixes) a story → AI writes scenes, illustrates them, and narrates each caption.
2. Teacher assigns the story to one or more students.
3. Student reads along on phone / laptop, listens to the native-voice narration, and records their own voice per scene.
4. Teacher reviews recordings and clicks **Evaluate story** — Gemini scores every recording, writes a one-line coaching tip, and auto-sets the assignment's star rating from the average.

---

## 2. Feature Surface

### Teacher
- **Story generation** (`/teacher/stories/new`) — title, description, difficulty (1-9), language, art style (15 options incl. Ghibli / Disney / Sanrio / Pokemon), narrator voice.
- **Story upload** (`/teacher/stories/upload`) — upload page images for an existing book; captions transcribed, audio generated. Client-side image compression via `browser-image-compression`.
- **Story library** (`/teacher`) — sorted by language → difficulty. Collapsible `<details>` cards. Per-story: Rename, Delete, Assign to student, Remix.
- **Scene editor** (`/teacher/stories/[id]`) — modify caption (with/without regenerating audio), record your own voiceover instead of TTS.
- **Student management** (`/teacher/students`) — create PIN student (one click, PIN revealed once), rename, reset PIN, delete, assign stories, set 1-5 star rating, click through to review.
- **Student review** (`/teacher/students/[studentId]/story/[storyId]`) — scene-by-scene playback of student recordings alongside reference audio. One-click **Evaluate story** button for AI scoring.
- **Class codes** (`/teacher/settings`) — manage codes students use for PIN sign-in.

### Student
- **PIN sign-in** (`/auth/signin/student`) — class code + 6-digit PIN. No email required.
- **Dashboard** (`/student`) — assigned stories + class leaderboard (ranked by total stars, own row highlighted).
- **Practice** (`/student/story/[id]`) — illustrated reader. "Listen" plays native-voice TTS. "Record" captures up to 30s, uploads direct to Vercel Blob, saves DB row. Mobile-first UI.

### Public
- **Landing page** (`/`) — hero + rotating 4-image gallery pulled from live scene library.
- **Features page** (`/features.html`) — static marketing sheet in `public/`.

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router + React 18 |
| Styling | Tailwind CSS (custom `brand` / `accent` / `ink` palettes in `tailwind.config.ts`) |
| Database | Neon Postgres via **Drizzle ORM** |
| Schema sync | `bunx drizzle-kit push` (no migrations directory — direct schema sync) |
| Auth | **NextAuth v5** (`next-auth@5.0.0-beta.25`) with `DrizzleAdapter`. Two providers: Google OAuth and a custom PIN credentials provider. |
| File storage | **Vercel Blob** (`@vercel/blob/client`, `access: "public"`, upload via `handleUploadUrl: "/api/upload"`). |
| AI generation | Gemini 3.1 Flash for story text. Gemini image generation for illustrations. Gemini 3.1 Flash TTS (Kore voices) for narration. |
| AI scoring | Gemini 2.5 Flash audio-understanding via REST `generateContent` with `inlineData` (base64) + `responseMimeType: "application/json"` + `responseSchema`. See `src/lib/aiScore.ts`. |
| Hosting | Vercel (Fluid Compute; eval endpoint uses `maxDuration = 120`). |

---

## 4. Database Schema

Source of truth: `src/lib/db/schema.ts`.

### `users`
`id` (UUID, PK) · `email` (unique) · `name` · `image` · `emailVerified` · `role` (enum: `teacher`|`student`) · `authKind` (default `"google"`, set to `"pin"` for PIN students) · `pinHash` · `pinUpdatedAt` · `createdAt`

### `class_codes`
`id` · `code` (unique) · `label` · `createdAt` — students must supply one of these codes alongside their PIN.

### `login_attempts`
`id` · `ip` · `kind` · `attemptedAt` · `succeeded` — indexed by `(ip, attemptedAt)` for rate-limit checks on PIN sign-in.

### `stories`
`id` · `title` · `description` · `difficulty` · `language` (default `"English"`) · `imageStyle` (default `"watercolor"`) · `voice` (default `"female"`) · `creatorId` (FK users, CASCADE) · `createdAt`

### `scenes`
`id` · `storyId` (FK stories, CASCADE) · `subtitle` · `imagePrompt` · `imageUrl` · `audioUrl` · `order`

### `assignments`
`id` · `studentId` (FK users, CASCADE) · `storyId` (FK stories, CASCADE) · `assignedBy` (FK users, CASCADE) · `rating` (nullable `real`, 0.5-step precision 0.5–5.0) · `createdAt`
**Unique:** `(studentId, storyId)`

### `recordings`
`id` · `assignmentId` (FK assignments, CASCADE) · `sceneId` (FK scenes, CASCADE) · `studentId` (FK users, CASCADE) · `audioUrl` · `recordedAt` · `aiScore` (nullable 1-5) · `aiFeedback` (nullable text) · `aiTranscript` (nullable text) · `aiEvaluatedAt` (nullable timestamp)
**Unique:** `(assignmentId, sceneId)` — re-records upsert with `onConflictDoUpdate`, **nulling out** all `ai_*` columns to invalidate stale scores.

NextAuth tables (`accounts`, `sessions`, `verification_tokens`) follow the Auth.js adapter spec.

---

## 5. Key Architectural Decisions

1. **Drizzle `push`, not migrations.** Schema changes are applied with `bunx drizzle-kit push` against Neon directly. No migration files in the repo.
2. **Blob URLs in DB, never base64.** Audio and images always stored on Vercel Blob; DB only holds URLs. `isOwnBlobUrl(url)` in `src/lib/blob.ts` validates any URL the server re-fetches as a defence-in-depth measure against poisoned rows exfiltrating data.
3. **AI scoring is text-based, not audio-to-audio.** The reference for "correct pronunciation" is the scene's subtitle, not the Kore TTS output — students shouldn't be graded on sounding like the TTS voice. `evaluateRecording({ language, subtitle, audioUrl })` sends the student audio + target text to Gemini, which returns `{ transcript, score, feedback }`.
4. **Evaluation is batch + teacher-triggered for review.** `POST /api/assignments/[id]/evaluate` (teacher-only, authorized via story-creator join) runs all scene evals in parallel via `Promise.allSettled`, writes each row, computes `averageRating = round(avg(scores) * 2) / 2` (half-star precision on the aggregate), and updates `assignments.rating`. Teacher can still manually override the rating after.
5. **Students see their own AI feedback inline.** After a student records, the client fires `POST /api/recordings/[id]/evaluate` (owner-only) asynchronously — the `/api/recordings` save itself stays instant, and the score + tip + heard-transcript appear under the recording when Gemini returns (~5–15s). Student view attributes the feedback to **"Virtual Coach Miss Luna"** via the optional `coach` prop on `RecordingScore`; the teacher review view omits the byline. Per-scene `recordings.aiScore` stays integer 1-5; only the aggregated `assignments.rating` has half-star precision.
6. **PIN students have no email.** Created via `POST /api/students` (teacher-only). PIN hashed with bcrypt, shown exactly once in `PinRevealModal`. `authKind = "pin"` distinguishes them from Google users.
7. **First-name-only display.** `displayName()` in `src/lib/names.ts` — used everywhere a student is shown in a shared UI (leaderboard, review page) for privacy.
8. **Cascading deletes handled by Postgres FK constraints**, not app code.

---

## 6. Where to Find Things

| Need | File |
|---|---|
| DB schema | `src/lib/db/schema.ts` |
| Auth config (Google + PIN) | `src/lib/auth.ts` |
| Gemini story/image/TTS generation | `src/lib/ai.ts` |
| Gemini pronunciation scoring | `src/lib/aiScore.ts` |
| Blob URL validation | `src/lib/blob.ts` |
| Student display-name helper | `src/lib/names.ts` |
| Story player (practice/review/preview modes) | `src/components/StoryPlayer.tsx` |
| PIN reveal dialog | `src/components/PinRevealModal.tsx` |
| Upload flow | `src/components/UploadStoryForm.tsx` + `src/app/api/stories/upload/route.ts` |
| Batch eval endpoint | `src/app/api/assignments/[id]/evaluate/route.ts` |

---

## 7. Conventions

- **Server components** do data fetching (via Drizzle); **client components** (`"use client"`) handle interactivity, and call `router.refresh()` after mutations.
- **API routes** return bare JSON with `NextResponse.json(...)` or `new NextResponse("Forbidden", { status: 403 })`.
- **Auth** enforced via `await auth()` at the top of every protected route/component.
- **`export const dynamic = "force-dynamic"`** on any page that reads current-user-specific data.
- **Mobile-first Tailwind** — default classes target mobile, `sm:`/`md:` scale up.
- **No comments unless non-obvious** — well-named identifiers do the job.
