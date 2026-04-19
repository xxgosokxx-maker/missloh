import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { generatePin, hashPin } from "@/lib/pin";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const [row] = await db
    .select({ authKind: users.authKind })
    .from(users)
    .where(eq(users.id, params.id));
  if (!row) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (row.authKind !== "pin") {
    return new NextResponse("Not a PIN student", { status: 400 });
  }

  const pin = generatePin();
  const pinHash = await hashPin(pin);

  await db
    .update(users)
    .set({ pinHash, pinUpdatedAt: new Date() })
    .where(eq(users.id, params.id));

  await db.delete(sessions).where(eq(sessions.userId, params.id));

  return NextResponse.json({ pin });
}
