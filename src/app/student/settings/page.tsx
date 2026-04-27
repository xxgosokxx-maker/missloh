import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { AvatarPicker } from "@/components/AvatarPicker";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentSettingsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "student") {
    redirect("/");
  }

  const [me] = await db
    .select({ name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, session.user.id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl tracking-tight text-ink-900">
          Settings
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Pick an avatar to show on the leaderboard.
        </p>
      </div>

      <AvatarPicker
        initialUrl={me?.avatarUrl ?? null}
        studentName={me?.name ?? null}
      />
    </div>
  );
}
