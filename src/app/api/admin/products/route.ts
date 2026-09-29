import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isResponse, requireRole } from "@/lib/auth";
import { fail, isUniqueError } from "@/lib/server";
import { parseProduct } from "@/lib/productInput";

export async function GET() {
  const s = await requireRole("ADMIN");
  if (isResponse(s)) return s;
  const products = await db.product.findMany({
    where: { active: true },
    include: { category: true, variants: { where: { active: true }, orderBy: { sku: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const s = await requireRole("ADMIN");
  if (isResponse(s)) return s;
  const parsed = parseProduct(await req.json().catch(() => null));
  if ("error" in parsed) return fail(parsed.error);
  const d = parsed.data;

  try {
    const categoryId = d.categoryName
      ? (await db.category.upsert({ where: { name: d.categoryName }, update: {}, create: { name: d.categoryName } })).id
      : null;
    const product = await db.product.create({
      data: {
        name: d.name,
        description: d.description,
        hsnCode: d.hsnCode,
        gstRate: d.gstRate,
        categoryId,
        variants: { create: d.variants.map(({ id, ...v }) => v) },
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    if (isUniqueError(e)) return fail("A SKU or barcode is already used by another variant", 409);
    throw e;
  }
}
