import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isResponse, requireRole } from "@/lib/auth";
import { fail, str } from "@/lib/server";

type Ctx = { params: { id: string } };

export async function PUT(req: Request, { params }: Ctx) {
  const s = await requireRole("ADMIN");
  if (isResponse(s)) return s;
  const b = await req.json().catch(() => ({}));
  const name = str(b.name);
  if (!name) return fail("Enter the supplier name");
  await db.supplier.update({
    where: { id: params.id },
    data: { name, phone: str(b.phone), email: str(b.email), address: str(b.address), gstin: str(b.gstin) },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const s = await requireRole("ADMIN");
  if (isResponse(s)) return s;
  const history =
    (await db.purchase.count({ where: { supplierId: params.id } })) +
    (await db.ledgerEntry.count({ where: { supplierId: params.id } }));
  if (history > 0) {
    await db.supplier.update({ where: { id: params.id }, data: { active: false } });
    return NextResponse.json({ ok: true, hidden: true });
  }
  await db.supplier.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true, hidden: false });
}
