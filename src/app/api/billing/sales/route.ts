import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isResponse, requireRole } from "@/lib/auth";
import { fail, str } from "@/lib/server";
import { round2 } from "@/lib/money";

type CartLine = { variantId: string; qty: number };
type PaymentLine = { method: "CASH" | "UPI" | "CARD"; amount: number; reference: string | null };

function parseBody(b: any): { error: string } | { items: CartLine[]; payments: PaymentLine[]; discount: number; customerName: string | null; customerPhone: string | null } {
  if (!Array.isArray(b?.items) || b.items.length === 0) return { error: "Add at least one item to the bill" };
  const items: CartLine[] = [];
  for (const i of b.items) {
    const qty = Number(i?.qty);
    if (!str(i?.variantId)) return { error: "Invalid item in cart" };
    if (!Number.isInteger(qty) || qty <= 0) return { error: "Item quantity must be a whole number greater than 0" };
    items.push({ variantId: i.variantId, qty });
  }
  if (!Array.isArray(b?.payments) || b.payments.length === 0) return { error: "Add at least one payment" };
  const payments: PaymentLine[] = [];
  for (const p of b.payments) {
    const amount = Number(p?.amount);
    if (!["CASH", "UPI", "CARD"].includes(p?.method)) return { error: "Invalid payment method" };
    if (!(amount > 0)) return { error: "Payment amount must be greater than 0" };
    payments.push({ method: p.method, amount: round2(amount), reference: str(p.reference) });
  }
  const discount = Number(b?.discount ?? 0);
  if (!(discount >= 0)) return { error: "Discount can't be negative" };
  return { items, payments, discount: round2(discount), customerName: str(b.customerName), customerPhone: str(b.customerPhone) };
}

type TxResult = { ok: true; sale: any } | { ok: false; error: string };

export async function POST(req: Request) {
  const s = await requireRole("ADMIN", "STAFF");
  if (isResponse(s)) return s;
  const parsed = parseBody(await req.json().catch(() => null));
  if ("error" in parsed) return fail(parsed.error);
  const { items, payments, discount, customerName, customerPhone } = parsed;

  try {
    const result: TxResult = await db.$transaction(async (tx: any): Promise<TxResult> => {
      const variantIds = items.map((i) => i.variantId);
      const variants = await tx.variant.findMany({
        where: { id: { in: variantIds }, active: true },
        include: { product: { select: { name: true, gstRate: true, active: true } } },
      });
      const byId = new Map<string, (typeof variants)[number]>(variants.map((v: (typeof variants)[number]) => [v.id, v]));

      let subtotal = 0, taxTotal = 0;
      const lineData: any[] = [];
      for (const line of items) {
        const v = byId.get(line.variantId);
        if (!v || !v.product.active) return { ok: false, error: `A product in the cart is no longer available` };
        if (v.stock < line.qty) return { ok: false, error: `Only ${v.stock} left in stock for ${v.product.name} (${v.sku})` };
        const unitPrice = Number(v.salePrice);
        const gstRate = Number(v.product.gstRate);
        const lineBase = round2(unitPrice * line.qty);
        const taxAmount = round2((lineBase * gstRate) / 100);
        subtotal = round2(subtotal + lineBase);
        taxTotal = round2(taxTotal + taxAmount);
        lineData.push({
          variantId: v.id, name: `${v.product.name}${v.size ? " " + v.size : ""}${v.color ? " " + v.color : ""}`,
          qty: line.qty, unitPrice, discount: 0, gstRate, taxAmount, lineTotal: round2(lineBase + taxAmount),
        });
      }
      if (discount > subtotal + taxTotal) return { ok: false, error: "Discount can't be more than the bill total" };
      const total = round2(subtotal - discount + taxTotal);
      const paid = round2(payments.reduce((a, p) => a + p.amount, 0));
      if (Math.abs(paid - total) > 0.01) return { ok: false, error: `Payments (₹${paid.toFixed(2)}) don't add up to the total (₹${total.toFixed(2)})` };

      const billNo = `INV-${Date.now().toString(36).toUpperCase()}`;
      const created = await tx.sale.create({
        data: {
          billNo, staffId: s.uid, customerName, customerPhone, subtotal, discount, taxTotal, total,
          items: { create: lineData },
          payments: { create: payments.map((p) => ({ method: p.method, amount: p.amount, reference: p.reference })) },
        },
        include: { items: true, payments: true, staff: { select: { name: true } } },
      });
      await Promise.all(
        items.map((line) => tx.variant.update({ where: { id: line.variantId }, data: { stock: { decrement: line.qty } } }))
      );
      await tx.ledgerEntry.create({ data: { type: "SALE", amount: total, description: billNo, saleId: created.id } });
      return { ok: true, sale: created };
    }, { timeout: 15000, maxWait: 10000 });

    if (!result.ok) return fail(result.error, 409);
    return NextResponse.json(result.sale, { status: 201 });
  } catch (e) {
    console.error("Sale creation failed:", e);
    return fail("Could not complete the sale. Please try again.", 500);
  }
}
