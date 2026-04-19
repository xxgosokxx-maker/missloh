import { TopBar } from "@/components/TopBar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}
