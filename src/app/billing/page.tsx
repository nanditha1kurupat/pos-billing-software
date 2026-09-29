"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

type Result = { id: string; sku: string; barcode: string | null; size: string | null; color: string | null; salePrice: string; stock: number; productName: string; gstRate: string };
type CartLine = { variantId: string; sku: string; name: string; qty: number; unitPrice: number; gstRate: number; stock: number };
type PayLine = { method: "CASH" | "UPI" | "CARD"; amount: string };

const rupee = (n: number) => `₹${n.toFixed(2)}`;

export default function BillingPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState("0");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [payments, setPayments] = useState<PayLine[]>([{ method: "CASH", amount: "" }]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); return; }
    const t = setTimeout(async () => {
      try { setResults(await api<Result[]>(`/api/billing/products?q=${encodeURIComponent(q)}`)); }
      catch { /* ignore transient search errors */ }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  function addToCart(r: Result) {
    if (r.stock <= 0) { setError(`${r.productName} (${r.sku}) is out of stock`); return; }
    setError("");
    setCart((c) => {
      const existing = c.find((l) => l.variantId === r.id);
      if (existing) {
        if (existing.qty + 1 > r.stock) { setError(`Only ${r.stock} in stock for ${r.sku}`); return c; }
        return c.map((l) => (l.variantId === r.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...c, { variantId: r.id, sku: r.sku, name: `${r.productName}${r.size ? " " + r.size : ""}${r.color ? " " + r.color : ""}`, qty: 1, unitPrice: Number(r.salePrice), gstRate: Number(r.gstRate), stock: r.stock }];
    });
    setQuery(""); setResults([]);
    searchRef.current?.focus();
  }

  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const exact = results.find((r) => r.barcode && r.barcode === query.trim()) ?? results[0];
    if (exact) addToCart(exact);
  }

  function setQty(variantId: string, qty: number) {
    setCart((c) => c.map((l) => {
      if (l.variantId !== variantId) return l;
      if (qty > l.stock) { setError(`Only ${l.stock} in stock for ${l.sku}`); return l; }
      return { ...l, qty: Math.max(1, Math.floor(qty) || 1) };
    }));
  }
  function removeLine(variantId: string) { setCart((c) => c.filter((l) => l.variantId !== variantId)); }

  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const taxTotal = cart.reduce((s, l) => s + (l.unitPrice * l.qty * l.gstRate) / 100, 0);
  const discountNum = Number(discount) || 0;
  const total = Math.max(0, subtotal - discountNum + taxTotal);
  const paid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const balance = round(total - paid);

  function round(n: number) { return Math.round((n + Number.EPSILON) * 100) / 100; }

  function addPayment() { setPayments((p) => [...p, { method: "CASH", amount: balance > 0 ? balance.toFixed(2) : "" }]); }
  function updatePayment(i: number, patch: Partial<PayLine>) { setPayments((p) => p.map((x, idx) => (idx === i ? { ...x, ...patch } : x))); }
  function removePayment(i: number) { setPayments((p) => p.filter((_, idx) => idx !== i)); }

  async function completeSale() {
    if (cart.length === 0) { setError("Add at least one item"); return; }
    if (Math.abs(balance) > 0.01) { setError(balance > 0 ? `₹${balance.toFixed(2)} still due` : `Payments exceed the total by ₹${(-balance).toFixed(2)}`); return; }
    setBusy(true); setError("");
    try {
      const sale = await api<{ id: string }>("/api/billing/sales", "POST", {
        items: cart.map((l) => ({ variantId: l.variantId, qty: l.qty })),
        payments: payments.filter((p) => Number(p.amount) > 0).map((p) => ({ method: p.method, amount: Number(p.amount) })),
        discount: discountNum, customerName: customerName || null, customerPhone: customerPhone || null,
      });
      router.push(`/billing/receipt/${sale.id}`);
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-semibold text-indigo">Billing</h1>
        <div className="relative mt-3">
          <input ref={searchRef} autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onSearchKeyDown}
            placeholder="Scan barcode or search by name / SKU"
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-base" />
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black/10">
              {results.map((r) => (
                <button key={r.id} onClick={() => addToCart(r)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-soft">
                  <span>{r.productName} {r.size} {r.color} <span className="text-slate-400">· {r.sku}</span></span>
                  <span className="flex items-center gap-3">
                    <span className={r.stock <= 0 ? "text-madder" : "text-slate-500"}>{r.stock} in stock</span>
                    <span className="font-medium">{rupee(Number(r.salePrice))}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-black/5">
          {cart.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Cart is empty. Search above to add products.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-3 py-2">Item</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Line total</th><th></th></tr>
              </thead>
              <tbody>
                {cart.map((l) => (
                  <tr key={l.variantId} className="border-t border-slate-100">
                    <td className="px-3 py-2">{l.name} <span className="text-slate-400">· {l.sku}</span></td>
                    <td className="px-3 py-2">
                      <input type="number" min={1} max={l.stock} value={l.qty}
                        onChange={(e) => setQty(l.variantId, Number(e.target.value))}
                        className="w-16 rounded-md border border-slate-300 px-2 py-1" />
                    </td>
                    <td className="px-3 py-2">{rupee(l.unitPrice)}</td>
                    <td className="px-3 py-2 font-medium">{rupee(l.unitPrice * l.qty)}</td>
                    <td className="px-3 py-2 text-right"><button onClick={() => removeLine(l.variantId)} className="text-madder hover:underline">Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5">
        <h2 className="font-semibold text-indigo">Bill summary</h2>
        <div className="mt-3 grid gap-2">
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name (optional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone (optional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>

        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{rupee(subtotal)}</dd></div>
          <div className="flex justify-between items-center"><dt className="text-slate-500">Discount</dt>
            <dd><input type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)}
              className="w-24 rounded-md border border-slate-300 px-2 py-1 text-right" /></dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">GST</dt><dd>{rupee(taxTotal)}</dd></div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-semibold"><dt>Total</dt><dd>{rupee(total)}</dd></div>
        </dl>

        <h3 className="mt-4 text-sm font-semibold text-indigo">Payment</h3>
        <div className="mt-2 space-y-2">
          {payments.map((p, i) => (
            <div key={i} className="flex gap-2">
              <select value={p.method} onChange={(e) => updatePayment(i, { method: e.target.value as PayLine["method"] })}
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                <option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option>
              </select>
              <input type="number" min={0} step="0.01" placeholder="Amount" value={p.amount}
                onChange={(e) => updatePayment(i, { amount: e.target.value })}
                className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
              {payments.length > 1 && <button onClick={() => removePayment(i)} className="text-madder hover:underline">✕</button>}
            </div>
          ))}
        </div>
        <button onClick={addPayment} className="mt-2 text-xs font-medium text-indigo hover:underline">+ Split payment</button>

        <p className={`mt-3 text-sm font-medium ${balance > 0.004 ? "text-madder" : balance < -0.004 ? "text-madder" : "text-emerald-600"}`}>
          {balance > 0.004 ? `Due: ${rupee(balance)}` : balance < -0.004 ? `Excess: ${rupee(-balance)}` : "Fully paid"}
        </p>
        {error && <p role="alert" className="mt-2 text-sm text-madder">{error}</p>}

        <button onClick={completeSale} disabled={busy || cart.length === 0}
          className="mt-4 w-full rounded-md bg-indigo px-4 py-2.5 font-medium text-white hover:bg-indigo-dark disabled:opacity-60">
          {busy ? "Processing..." : "Complete sale & print bill"}
        </button>
      </div>
    </div>
  );
}
