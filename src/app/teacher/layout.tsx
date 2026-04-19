import { TopBar } from "@/components/TopBar";
import Link from "next/link";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <TopBar />
      <nav className="border-b border-ink-100/70 bg-white/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 sm:px-6">
          <TabLink href="/teacher">Stories</TabLink>
          <TabLink href="/teacher/students">Students</TabLink>
          <TabLink href="/teacher/settings">Settings</TabLink>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

function TabLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative rounded-t-2xl px-4 py-3 text-sm font-medium text-ink-600 transition hover:text-ink-900"
    >
      {children}
    </Link>
  );
}
