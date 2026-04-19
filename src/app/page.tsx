import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    if (!session.user.role) redirect("/onboarding");
    redirect(session.user.role === "teacher" ? "/teacher" : "/student");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-5xl font-bold text-brand-600">Miss Loh Tutoring</h1>
        <p className="mt-4 text-lg text-slate-600">
          AI-powered picture books for language learners. Teachers generate
          stories with native-speaker audio; students practice by reading and
          recording themselves.
        </p>
        <Link
          href="/auth/signin"
          className="mt-8 inline-block rounded-md bg-brand-600 px-6 py-3 text-white hover:bg-brand-700"
        >
          Sign in with Google
        </Link>
      </div>
    </main>
  );
}
