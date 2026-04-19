import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { generatePin, hashPin } from "@/lib/pin";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { name } = (await req.json()) as { name?: string };
  const trimmed = name?.trim();
  if (!trimmed) {
    return new NextResponse("Name required", { status: 400 });
  }

  const id = randomUUID();
  const pin = generatePin();
  const pinHash = await hashPin(pin);

  await db.insert(users).values({
    id,
    email: `pin-${id}@students.missloh.local`,
    name: trimmed,
    role: "student",
    authKind: "pin",
    pinHash,
    pinUpdatedAt: new Date(),
  });

  return NextResponse.json({ id, name: trimmed, pin });
}
