import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StudentSignInForm } from "./StudentSignInForm";

export default async function StudentSignInPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "teacher" ? "/teacher" : "/student");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-200/60 to-accent-200/50 blur-3xl" />
      </div>

      <div className="card w-full max-w-sm p-8">
        <Link href="/" className="inline-flex items-center gap-2.5 text-ink-900">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow">
            <span className="font-display text-lg leading-none">M</span>
          </span>
          <span className="font-display text-lg tracking-tight">
            Miss Loh's <span className="text-brand-600">Language Master</span>
          </span>
        </Link>

        <h1 className="mt-6 font-display text-3xl tracking-tight text-ink-900">
          Student sign in
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Enter your class code and 6-digit PIN.
        </p>

        <StudentSignInForm />

        <div className="mt-6 text-center">
          <Link
            href="/auth/signin"
            className="text-xs font-medium text-ink-500 hover:text-brand-600"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
