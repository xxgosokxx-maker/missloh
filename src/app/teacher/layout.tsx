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
      <nav className="border-b bg-white px-6">
        <div className="flex gap-6 text-sm">
          <Link
            href="/teacher"
            className="border-b-2 border-transparent py-3 hover:border-brand-600"
          >
            Stories
          </Link>
          <Link
            href="/teacher/students"
            className="border-b-2 border-transparent py-3 hover:border-brand-600"
          >
            Students
          </Link>
        </div>
      </nav>
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}
