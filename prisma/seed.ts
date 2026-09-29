import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const hash = (p: string) => bcrypt.hashSync(p, 10);

  await db.user.upsert({
    where: { email: "admin@textile.test" },
    update: {},
    create: { name: "Store Admin", email: "admin@textile.test", passwordHash: hash("Admin@123"), role: "ADMIN" },
  });
  await db.user.upsert({
    where: { email: "staff@textile.test" },
    update: {},
    create: { name: "Counter Staff", email: "staff@textile.test", passwordHash: hash("Staff@123"), role: "STAFF" },
  });

  const cats: Record<string, string> = {};
  for (const name of ["Sarees", "Shirts", "Kids Wear", "Fabrics"]) {
    const c = await db.category.upsert({ where: { name }, update: {}, create: { name } });
    cats[name] = c.id;
  }

  const suppliers = [
    { name: "Kanchi Silks Wholesale", phone: "9840011122", gstin: "33AAAAA0000A1Z5", address: "Kanchipuram, Tamil Nadu" },
    { name: "Tirupur Knit Garments", phone: "9843322110", gstin: "33BBBBB1111B1Z6", address: "Tirupur, Tamil Nadu" },
  ];
  for (const s of suppliers) {
    const exists = await db.supplier.findFirst({ where: { name: s.name } });
    if (!exists) await db.supplier.create({ data: s });
  }

  if ((await db.product.count()) === 0) {
    const items: { name: string; cat: string; gst: number; variants: [string, string | null, string | null, number, number, number][] }[] = [
      { name: "Kanchipuram Silk Saree", cat: "Sarees", gst: 5, variants: [
        ["SAR-KS-RED", null, "Red", 3200, 4500, 12], ["SAR-KS-GRN", null, "Green", 3200, 4500, 8] ] },
      { name: "Cotton Handloom Saree", cat: "Sarees", gst: 5, variants: [
        ["SAR-CH-BLU", null, "Blue", 650, 999, 25], ["SAR-CH-YLW", null, "Yellow", 650, 999, 20] ] },
      { name: "Formal Shirt", cat: "Shirts", gst: 5, variants: [
        ["SH-FRM-M-WHT", "M", "White", 380, 799, 30], ["SH-FRM-L-WHT", "L", "White", 380, 799, 28],
        ["SH-FRM-M-BLU", "M", "Blue", 380, 799, 3] ] },
      { name: "Kids Cotton Frock", cat: "Kids Wear", gst: 5, variants: [
        ["KD-FRK-4-PNK", "4Y", "Pink", 220, 449, 15], ["KD-FRK-6-PNK", "6Y", "Pink", 220, 449, 15] ] },
      { name: "Cotton Fabric (per metre)", cat: "Fabrics", gst: 5, variants: [
        ["FB-COT-WHT", null, "White", 90, 160, 200] ] },
    ];
    let n = 1000;
    for (const it of items) {
      await db.product.create({
        data: {
          name: it.name, categoryId: cats[it.cat], gstRate: it.gst, hsnCode: "5407",
          variants: { create: it.variants.map(([sku, size, color, cost, sale, stock]) => ({
            sku, size, color, costPrice: cost, salePrice: sale, stock, barcode: String(890000000000 + n++),
          })) },
        },
      });
    }
  }
  console.log("Seed complete");
}

main().finally(() => db.$disconnect());
