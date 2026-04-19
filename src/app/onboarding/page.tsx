import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function setRole(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  const role = formData.get("role");
  if (role !== "teacher" && role !== "student") return;
  await db.update(users).set({ role }).where(eq(users.id, session.user.id));
  revalidatePath("/");
  redirect(role === "teacher" ? "/teacher" : "/student");
}

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  if (session.user.role) {
    redirect(session.user.role === "teacher" ? "/teacher" : "/student");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Welcome, {session.user.name}</h1>
        <p className="mt-2 text-slate-600">Pick your role to continue.</p>
        <form action={setRole} className="mt-6 grid grid-cols-2 gap-4">
          <button
            name="role"
            value="teacher"
            className="rounded-xl border p-6 text-left hover:border-brand-600"
          >
            <div className="text-lg font-semibold">Teacher</div>
            <div className="mt-1 text-sm text-slate-600">
              Generate picture books and assign them to students.
            </div>
          </button>
          <button
            name="role"
            value="student"
            className="rounded-xl border p-6 text-left hover:border-brand-600"
          >
            <div className="text-lg font-semibold">Student</div>
            <div className="mt-1 text-sm text-slate-600">
              Read assigned stories and record yourself.
            </div>
          </button>
        </form>
      </div>
    </main>
  );
}
