import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isResponse, requireRole } from "@/lib/auth";
import { fail } from "@/lib/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = await requireRole("ADMIN", "STAFF");
  if (isResponse(s)) return s;
  const sale = await db.sale.findUnique({
    where: { id: params.id },
    include: { items: true, payments: true, staff: { select: { name: true } } },
  });
  if (!sale) return fail("Bill not found", 404);
  return NextResponse.json(sale);
}
