import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isResponse, requireRole } from "@/lib/auth";
import { fail, str } from "@/lib/server";

export async function GET() {
  const s = await requireRole("ADMIN");
  if (isResponse(s)) return s;
  const suppliers = await db.supplier.findMany({
    where: { active: true },
    include: { _count: { select: { purchases: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(req: Request) {
  const s = await requireRole("ADMIN");
  if (isResponse(s)) return s;
  const b = await req.json().catch(() => ({}));
  const name = str(b.name);
  if (!name) return fail("Enter the supplier name");
  const supplier = await db.supplier.create({
    data: { name, phone: str(b.phone), email: str(b.email), address: str(b.address), gstin: str(b.gstin) },
  });
  return NextResponse.json(supplier, { status: 201 });
}
