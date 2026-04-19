import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StoryGenerator } from "@/components/StoryGenerator";

export const dynamic = "force-dynamic";

export default async function NewStoryPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/teacher"
          className="text-sm text-ink-500 transition hover:text-brand-600"
        >
          ← Back to stories
        </Link>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-ink-900">
          Generate a new story
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Pick a language, art style, and difficulty. We&apos;ll draft scenes,
          illustrate them, and narrate them in a natural voice.
        </p>
      </div>
      <StoryGenerator />
    </div>
  );
}
