import Link from "next/link";
import { signOut, auth } from "@/lib/auth";

export async function TopBar() {
  const session = await auth();
  const initial = session?.user?.name?.[0]?.toUpperCase() ?? "·";
  return (
    <header className="sticky top-0 z-30 border-b border-ink-100/70 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow">
            <span className="font-display text-lg leading-none">M</span>
          </span>
          <span className="font-display text-lg tracking-tight text-ink-900">
            Miss Loh's <span className="text-brand-600">Language Master</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ink-900 text-xs font-medium text-white">
              {initial}
            </span>
            <div className="leading-tight">
              <div className="font-medium text-ink-900">
                {session?.user?.name}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-ink-500">
                {session?.user?.role}
              </div>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="btn-ghost">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
