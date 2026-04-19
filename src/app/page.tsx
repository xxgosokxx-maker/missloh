import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RandomGallery } from "@/components/RandomGallery";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "teacher" ? "/teacher" : "/student");
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-200/60 via-accent-200/50 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] translate-x-1/4 translate-y-1/4 rounded-full bg-brand-300/30 blur-3xl" />
      </div>

      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-ink-900 sm:text-6xl md:text-7xl">
          Read. Listen.
          <br />
          <span className="bg-gradient-to-br from-brand-500 to-brand-700 bg-clip-text text-transparent">
            Find your voice.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-600">
          Open your next picture book, hear each page read in a native voice,
          then record yourself reading it back. Miss Loh will be proud.
        </p>
        <div className="mt-10 flex justify-center">
          <Link href="/auth/signin" className="btn-primary px-6 py-3 text-base">
            Begin your journey
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="mt-20 w-full">
          <div className="mb-4 text-xs uppercase tracking-wide text-ink-500">
            From Miss Loh's Library
          </div>
          <RandomGallery />
        </div>
      </section>
    </main>
  );
}
