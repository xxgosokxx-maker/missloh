import Link from "next/link";
import { signOut, auth } from "@/lib/auth";

export async function TopBar() {
  const session = await auth();
  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3">
      <Link href="/" className="text-lg font-semibold text-brand-600">
        Miss Loh Tutoring
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-600">
          {session?.user?.name}{" "}
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs uppercase tracking-wide">
            {session?.user?.role}
          </span>
        </span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="text-slate-500 hover:text-slate-900">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
