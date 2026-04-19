import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { classCodes } from "@/lib/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const rows = await db
    .select()
    .from(classCodes)
    .orderBy(desc(classCodes.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { code, label } = (await req.json()) as {
    code?: string;
    label?: string;
  };
  const trimmedCode = code?.trim();
  const trimmedLabel = label?.trim() || null;

  if (!trimmedCode || trimmedCode.length < 4) {
    return new NextResponse("Code must be at least 4 characters", {
      status: 400,
    });
  }

  try {
    const [row] = await db
      .insert(classCodes)
      .values({ code: trimmedCode, label: trimmedLabel })
      .returning();
    return NextResponse.json(row);
  } catch (err) {
    const msg = (err as Error).message ?? "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return new NextResponse("Code already exists", { status: 409 });
    }
    throw err;
  }
}
