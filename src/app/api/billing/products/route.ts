import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isResponse, requireRole } from "@/lib/auth";

export async function GET(req: Request) {
  const s = await requireRole("ADMIN", "STAFF");
  if (isResponse(s)) return s;
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json([]);

  const variants = await db.variant.findMany({
    where: {
      active: true,
      product: { active: true },
      OR: [
        { sku: { contains: q, mode: "insensitive" } },
        { barcode: { equals: q } },
        { product: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: { product: { select: { name: true, gstRate: true } } },
    take: 15,
    orderBy: { sku: "asc" },
  });
  return NextResponse.json(
    variants.map((v: (typeof variants)[number]) => ({
      id: v.id, sku: v.sku, barcode: v.barcode, size: v.size, color: v.color,
      salePrice: v.salePrice, stock: v.stock, productName: v.product.name, gstRate: v.product.gstRate,
    }))
  );
}
