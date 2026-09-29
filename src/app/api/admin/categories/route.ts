import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isResponse, requireRole } from "@/lib/auth";

export async function GET() {
  const s = await requireRole("ADMIN");
  if (isResponse(s)) return s;
  const cats = await db.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(cats);
}
