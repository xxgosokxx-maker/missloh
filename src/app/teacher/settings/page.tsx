import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { classCodes } from "@/lib/db/schema";
import { ClassCodeManager } from "@/components/ClassCodeManager";

export const dynamic = "force-dynamic";

export default async function TeacherSettingsPage() {
  const codes = await db
    .select({
      id: classCodes.id,
      code: classCodes.code,
      label: classCodes.label,
    })
    .from(classCodes)
    .orderBy(desc(classCodes.createdAt));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl tracking-tight text-ink-900">
          Settings
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Manage class codes for student PIN sign-in.
        </p>
      </div>

      <section>
        <h3 className="font-display text-xl text-ink-900">Class codes</h3>
        <div className="mt-3">
          <ClassCodeManager initial={codes} />
        </div>
      </section>
    </div>
  );
}
