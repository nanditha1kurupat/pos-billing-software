import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isResponse, requireRole } from "@/lib/auth";
import { fail, isUniqueError } from "@/lib/server";
import { parseProduct } from "@/lib/productInput";

type Ctx = { params: { id: string } };

export async function PUT(req: Request, { params }: Ctx) {
  const s = await requireRole("ADMIN");
  if (isResponse(s)) return s;
  const parsed = parseProduct(await req.json().catch(() => null));
  if ("error" in parsed) return fail(parsed.error);
  const d = parsed.data;

  try {
    const categoryId = d.categoryName
      ? (await db.category.upsert({ where: { name: d.categoryName }, update: {}, create: { name: d.categoryName } })).id
      : null;

    await db.$transaction(async (tx: any) => {
      await tx.product.update({
        where: { id: params.id },
        data: { name: d.name, description: d.description, hsnCode: d.hsnCode, gstRate: d.gstRate, categoryId },
      });
      const existing = await tx.variant.findMany({ where: { productId: params.id, active: true }, select: { id: true } });
      const existingIds = new Set(existing.map((e: { id: string }) => e.id));
      const keep = new Set(d.variants.filter((v) => v.id).map((v) => v.id as string));

      // Variants removed in the form: delete if never used, otherwise hide them so old bills stay intact
      for (const e of existing) {
        if (keep.has(e.id)) continue;
        const used =
          (await tx.saleItem.count({ where: { variantId: e.id } })) +
          (await tx.purchaseItem.count({ where: { variantId: e.id } }));
        if (used > 0) await tx.variant.update({ where: { id: e.id }, data: { active: false } });
        else await tx.variant.delete({ where: { id: e.id } });
      }
      for (const { id, ...v } of d.variants) {
        if (id) {
          if (!existingIds.has(id)) throw new Error("Variant does not belong to this product");
          await tx.variant.update({ where: { id }, data: v });
        } else {
          await tx.variant.create({ data: { ...v, productId: params.id } });
        }
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (isUniqueError(e)) return fail("A SKU or barcode is already used by another variant", 409);
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const s = await requireRole("ADMIN");
  if (isResponse(s)) return s;

  const variants = await db.variant.findMany({ where: { productId: params.id }, select: { id: true } });
  const ids = variants.map((v: { id: string }) => v.id);
  const used =
    (await db.saleItem.count({ where: { variantId: { in: ids } } })) +
    (await db.purchaseItem.count({ where: { variantId: { in: ids } } }));

  if (used > 0) {
    // Has billing history: hide instead of delete
    await db.$transaction([
      db.variant.updateMany({ where: { productId: params.id }, data: { active: false } }),
      db.product.update({ where: { id: params.id }, data: { active: false } }),
    ]);
    return NextResponse.json({ ok: true, hidden: true });
  }
  await db.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true, hidden: false });
}
