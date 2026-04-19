import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UploadStoryForm } from "@/components/UploadStoryForm";

export const dynamic = "force-dynamic";

export default async function UploadStoryPage() {
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
          Upload your own story
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Add your own images and captions — we&apos;ll narrate each page in a
          native voice. Paste a screenshot, drag images in, or click to browse.
        </p>
      </div>
      <UploadStoryForm />
    </div>
  );
}
