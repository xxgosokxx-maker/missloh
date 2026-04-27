# Miss Loh's Language Master

A web app that helps kids learn to read and speak a new language by turning lessons into illustrated, narrated picture-book stories — and then using AI to coach their pronunciation.

## The Idea, in One Paragraph

A teacher types in a story idea. The app writes the story, paints the pictures, and reads it aloud in a native voice. The teacher assigns it to a student. The student opens it on a phone or laptop, listens to each page, and records themselves reading it back. AI then listens to those recordings, scores how well the student pronounced each sentence, and leaves a short coaching tip.

## Who It's For

- **Teachers** — generate, customize, and assign stories; track student progress; review recordings.
- **Students** — read along, listen to native-voice narration, and practice speaking out loud.

Students don't need an email address. The teacher hands out a class code, and each student logs in with that code plus a 6-digit PIN.

## What a Teacher Can Do

- **Make a story from a prompt.** Pick a title, language, difficulty (beginner / intermediate / advanced), art style (watercolor, Ghibli, Disney, Pokemon, and 12 others), and narrator voice. The app generates the scenes, illustrations, and audio.
- **Upload an existing book.** Snap photos of the pages and the app transcribes the captions and generates fresh narration.
- **Edit any scene.** Tweak the caption, regenerate the audio, or record their own voice over a page.
- **Manage students.** Create PIN-based accounts in one click, reset PINs, assign stories, and rate students 1–5 stars.
- **Review recordings.** Play back what each student recorded, side-by-side with the reference narration. One click runs AI evaluation across the whole story and fills in a score for each scene plus an overall star rating.

## What a Student Can Do

- **Sign in with a class code and PIN.** No email, no password.
- **See assigned stories** plus a class leaderboard ranked by total stars.
- **Practice a story.** Each page shows the illustration and caption. Tap "Listen" to hear it narrated, tap "Record" to read it aloud (up to 30 seconds per page).
- **Get instant feedback** from "Virtual Coach Miss Luna" — a score, a one-line tip, and the transcript of what the AI heard them say.

## How the AI Pieces Fit Together

- **Story writing** — Gemini 3.1 Flash drafts the scenes from the teacher's prompt.
- **Illustrations** — Gemini's image generator paints each page in the chosen art style.
- **Narration** — Gemini's text-to-speech reads each caption in a native voice, with pacing tuned to the difficulty level.
- **Pronunciation scoring** — Gemini 2.5 Flash listens to the student's recording, compares it to the target sentence (not to the TTS voice — students shouldn't be graded on imitating a robot), and returns a score, a transcript, and a coaching tip.

## The Practical Stuff

- Built as a Next.js web app, so it runs in any modern browser on phone or laptop.
- Audio and images live on Vercel Blob storage; the database (Postgres) only holds links to them.
- When a student re-records a page, the old AI score is wiped so the new attempt gets a fresh evaluation.
- Names are shown first-name-only anywhere classmates can see each other (leaderboard, review pages), for privacy.
