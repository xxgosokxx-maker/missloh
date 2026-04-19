# Miss Loh Tutoring - AI Language Learning App
## Migration Blueprint (Vercel + Neon.tech)

This file summarizes the features and workflows built in the Firebase/Vite prototype, structured to help Claude Code recreate the application using a PostgreSQL (Neon.tech) and Next.js/Vercel stack.

### 1. App Overview
A language learning platform where teachers can generate AI-powered picture books (stories) with native text-to-speech audio, assign them to students, and review the students' own voice recordings as they practice reading.

### 2. Core Features Implemented
*   **Role-Based Authentication:** Users are either `teacher` or `student`.
*   **Teacher Dashboard:**
    *   **Stories Tab:** View generated stories. Delete stories (and associated scenes in a cascaded delete). Add/Remix stories.
    *   **Students Tab:** View all students, assign stories, remove assignments, and click into an assignment to review the student's work.
*   **Story Generation (AI):**
    *   Input: Title, description, difficulty, language, and art style.
    *   Output: A list of scenes. Each scene has an `imagePrompt`, a `subtitle` (translated/target text), an `imageUrl` (generated art), and `audioBase64` (generated text-to-speech audio).
*   **Student Dashboard:**
    *   View all assigned stories sorted by date.
*   **Interactive Story Player:**
    *   **Playback:** Read the subtitle, view the generated image, and click "Listen" to hear the generated TTS pronunciation.
    *   **Student Mode:** A "Record" button captures the student's microphone via `MediaRecorder`. When stopped, it compresses it to `.webm` and uploads it.
    *   **Review Mode (Teacher):** When the teacher accesses the player via the Student Dashboard (e.g., `?studentId=123`), the Record button is hidden, and replaced with a "Student's Audio" playback bar fetched from the database.

---

### 3. Target Tech Stack (Vercel Ecosystem)
Since you are migrating away from Firebase to **Vercel + Neon.tech**:

*   **Framework:** Next.js (App Router recommended for API routes and Server Actions)
*   **Database:** Neon.tech (Serverless Postgres)
*   **ORM:** Drizzle ORM or Prisma (Drizzle is highly recommended for edge-compatibility)
*   **Authentication:** NextAuth.js (Auth.js v5) or Clerk. NextAuth integrates easily with Neon.
*   **File Storage:** **Vercel Blob** or AWS S3. *(Crucial Note: In the Firebase version, we stored audio and images as raw `base64` strings in the document. You should NOT do this in Postgres as it will bloat the database. Store files in Vercel Blob and save the URL strings in Neon.)*

---

### 4. Database Schema (Relational Design)

To recreate the Firestore NoSQL structures in Neon.tech, build the following relational tables:

**`users`**
*   `id` (UUID, PK)
*   `email` (String, Unique)
*   `name` (String)
*   `role` (Enum: 'teacher', 'student')
*   `created_at` (Timestamp)

**`stories`**
*   `id` (UUID, PK)
*   `title` (String)
*   `description` (Text)
*   `difficulty` (Int)
*   `language` (String)
*   `image_style` (String)
*   `creator_id` (UUID, FK -> users.id)
*   `created_at` (Timestamp)

**`scenes`**
*   `id` (UUID, PK)
*   `story_id` (UUID, FK -> stories.id, ON DELETE CASCADE)
*   `subtitle` (Text)
*   `image_prompt` (Text)
*   `image_url` (String) - *URL from Vercel Blob*
*   `audio_url` (String) - *URL from Vercel Blob*
*   `order` (Int)

**`assignments`**
*   `id` (UUID, PK)
*   `student_id` (UUID, FK -> users.id)
*   `story_id` (UUID, FK -> stories.id, ON DELETE CASCADE)
*   `assigned_by` (UUID, FK -> users.id)
*   `created_at` (Timestamp)
*   *Constraint: Unique(student_id, story_id)*

**`recordings`**
*   `id` (UUID, PK)
*   `assignment_id` (UUID, FK -> assignments.id, ON DELETE CASCADE)
*   `scene_id` (UUID, FK -> scenes.id, ON DELETE CASCADE)
*   `student_id` (UUID, FK -> users.id)
*   `audio_url` (String) - *URL from Vercel Blob (student's webm recording)*
*   `recorded_at` (Timestamp)
*   *Constraint: Unique(assignment_id, scene_id)*

---

### 5. Key Pitfalls & Migration Notes for Claude

1.  **Deletion Cascades:** In Firebase, we had to manually batch delete Scenes when deleting a Story, and manually handle rules. In Neon + Drizzle/Prisma, ensure you set `ON DELETE CASCADE` on your foreign keys so deleting a Story natively wipes its Scenes, Assignments, and Recordings.
2.  **Audio Processing:** 
    *   *Firebase prototype:* `MediaRecorder` created a `.webm` Blob, which was converted to a base64 string and pushed to Firestore.
    *   *Next.js update:* Use `client.upload()` from `@vercel/blob` to directly upload the Blob from the browser to Vercel Blob, then pass the resulting URL to your Next.js Server Action to insert the DB row into the `recordings` table.
3.  **Teacher Review Query:** In the `StoryPlayer`, you will need a specialized Server Component or API fetch that looks for `searchParams.studentId`. If it exists, fetch the `recordings` table where `student_id = searchParams.studentId` and `scene_id = current_scene.id` to inject the audio URLs back into the props.
4.  **AI Integration:** You will need to wire up `generateText` and `generateImage` (from `@ai-sdk/core` or `openai`) in Next.js API routes to handle the "Story Generator" component. Replace the frontend-only AI logic with protected Server Actions.

### 6. Suggested Claude Prompts to Start
If you are initializing this in Claude Code, run the following:
1. "Read CLAUDE.md. Initialize a new Next.js 14 App Router project with Tailwind, Drizzle ORM, and configure it for Neon.tech Postgres."
2. "Create the schema.ts file matching the relational design in CLAUDE.md, and generate the Drizzle migrations."
3. "Implement NextAuth/Auth.js with a Google Provider and scaffold the Teacher and Student dashboards based on the feature list in CLAUDE.md."
