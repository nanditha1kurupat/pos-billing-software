import { str } from "./server";

export type VariantInput = {
  id?: string;
  sku: string;
  barcode: string | null;
  size: string | null;
  color: string | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  reorderLevel: number;
};
export type ProductInput = {
  name: string;
  description: string | null;
  hsnCode: string | null;
  gstRate: number;
  categoryName: string | null;
  variants: VariantInput[];
};

export function parseProduct(b: any): { error: string } | { data: ProductInput } {
  const name = str(b?.name);
  if (!name) return { error: "Enter a product name" };
  const gstRate = Number(b?.gstRate ?? 5);
  if (!(gstRate >= 0 && gstRate <= 28)) return { error: "GST rate must be between 0 and 28" };
  if (!Array.isArray(b?.variants) || b.variants.length === 0) return { error: "Add at least one variant" };

  const skus = new Set<string>();
  const variants: VariantInput[] = [];
  for (const v of b.variants) {
    const sku = str(v?.sku);
    if (!sku) return { error: "Every variant needs a SKU" };
    if (skus.has(sku)) return { error: `SKU ${sku} is used twice` };
    skus.add(sku);
    const costPrice = Number(v.costPrice);
    const salePrice = Number(v.salePrice);
    const stock = Number(v.stock ?? 0);
    const reorderLevel = Number(v.reorderLevel ?? 5);
    if (!(costPrice >= 0) || !(salePrice > 0)) return { error: `Check the prices for ${sku}` };
    if (!Number.isInteger(stock) || stock < 0) return { error: `Stock for ${sku} must be a whole number` };
    if (!Number.isInteger(reorderLevel) || reorderLevel < 0) return { error: `Reorder level for ${sku} must be a whole number` };
    variants.push({
      id: str(v.id) ?? undefined,
      sku,
      barcode: str(v.barcode),
      size: str(v.size),
      color: str(v.color),
      costPrice,
      salePrice,
      stock,
      reorderLevel,
    });
  }
  return {
    data: { name, description: str(b.description), hsnCode: str(b.hsnCode), gstRate, categoryName: str(b.categoryName), variants },
  };
}
