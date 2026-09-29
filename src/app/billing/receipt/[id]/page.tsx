"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

type Sale = {
  id: string; billNo: string; customerName: string | null; customerPhone: string | null;
  subtotal: string; discount: string; taxTotal: string; total: string; createdAt: string;
  staff: { name: string };
  items: { id: string; name: string; qty: number; unitPrice: string; gstRate: string; taxAmount: string; lineTotal: string }[];
  payments: { id: string; method: string; amount: string }[];
};
const rupee = (n: string | number) => `₹${Number(n).toFixed(2)}`;

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const [sale, setSale] = useState<Sale | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Sale>(`/api/billing/sales/${params.id}`).then(setSale).catch((e) => setError(e.message));
  }, [params.id]);

  if (error) return <div className="p-6 text-madder">{error}</div>;
  if (!sale) return <div className="p-6 text-slate-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="mb-4 flex gap-2 print:hidden">
        <button onClick={() => window.print()} className="rounded-md bg-indigo px-4 py-2 text-sm font-medium text-white hover:bg-indigo-dark">Print bill</button>
        <Link href="/billing" className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">New sale</Link>
      </div>
      <div className="rounded-lg bg-white p-5 font-mono text-sm shadow-sm ring-1 ring-black/5 print:shadow-none print:ring-0">
        <div className="text-center">
          <p className="text-base font-semibold">Textile POS</p>
          <p className="text-xs text-slate-500">Bill: {sale.billNo}</p>
          <p className="text-xs text-slate-500">{new Date(sale.createdAt).toLocaleString("en-IN")}</p>
          <p className="text-xs text-slate-500">Billed by: {sale.staff.name}</p>
        </div>
        {(sale.customerName || sale.customerPhone) && (
          <div className="mt-2 border-t border-dashed border-slate-300 pt-2 text-xs">
            {sale.customerName && <p>Customer: {sale.customerName}</p>}
            {sale.customerPhone && <p>Phone: {sale.customerPhone}</p>}
          </div>
        )}
        <table className="mt-3 w-full border-t border-dashed border-slate-300 pt-2 text-xs">
          <thead><tr className="text-left"><th className="py-1">Item</th><th className="py-1 text-right">Qty</th><th className="py-1 text-right">Rate</th><th className="py-1 text-right">Amt</th></tr></thead>
          <tbody>
            {sale.items.map((it) => (
              <tr key={it.id}><td className="py-0.5">{it.name}</td><td className="py-0.5 text-right">{it.qty}</td>
                <td className="py-0.5 text-right">{Number(it.unitPrice).toFixed(2)}</td>
                <td className="py-0.5 text-right">{(Number(it.unitPrice) * it.qty).toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 space-y-0.5 border-t border-dashed border-slate-300 pt-2 text-xs">
          <div className="flex justify-between"><span>Subtotal</span><span>{rupee(sale.subtotal)}</span></div>
          <div className="flex justify-between"><span>Discount</span><span>-{rupee(sale.discount)}</span></div>
          <div className="flex justify-between"><span>GST</span><span>{rupee(sale.taxTotal)}</span></div>
          <div className="flex justify-between text-sm font-semibold"><span>Total</span><span>{rupee(sale.total)}</span></div>
        </div>
        <div className="mt-2 space-y-0.5 border-t border-dashed border-slate-300 pt-2 text-xs">
          {sale.payments.map((p) => (
            <div key={p.id} className="flex justify-between"><span>{p.method}</span><span>{rupee(p.amount)}</span></div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">Thank you for shopping with us!</p>
      </div>
    </div>
  );
}
