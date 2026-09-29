"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type Variant = {
  id?: string; sku: string; barcode: string; size: string; color: string;
  costPrice: string; salePrice: string; stock: string; reorderLevel: string;
};
type Product = {
  id: string; name: string; description: string | null; hsnCode: string | null;
  gstRate: string; category: { name: string } | null;
  variants: { id: string; sku: string; barcode: string | null; size: string | null; color: string | null;
    costPrice: string; salePrice: string; stock: number; reorderLevel: number }[];
};

const blankVariant = (): Variant => ({ sku: "", barcode: "", size: "", color: "", costPrice: "", salePrice: "", stock: "0", reorderLevel: "5" });
const emptyForm = () => ({ name: "", description: "", hsnCode: "", gstRate: "5", categoryName: "", variants: [blankVariant()] });

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    try { setProducts(await api<Product[]>("/api/admin/products")); }
    catch (e) { setError((e as Error).message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function startNew() { setEditingId(null); setForm(emptyForm()); setOpen(true); setError(""); }
  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name, description: p.description ?? "", hsnCode: p.hsnCode ?? "", gstRate: p.gstRate,
      categoryName: p.category?.name ?? "",
      variants: p.variants.map((v) => ({
        id: v.id, sku: v.sku, barcode: v.barcode ?? "", size: v.size ?? "", color: v.color ?? "",
        costPrice: v.costPrice, salePrice: v.salePrice, stock: String(v.stock), reorderLevel: String(v.reorderLevel),
      })),
    });
    setOpen(true); setError("");
  }

  function updateVariant(i: number, patch: Partial<Variant>) {
    setForm((f) => ({ ...f, variants: f.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) }));
  }
  function addVariant() { setForm((f) => ({ ...f, variants: [...f.variants, blankVariant()] })); }
  function removeVariant(i: number) { setForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const body = {
      name: form.name, description: form.description || null, hsnCode: form.hsnCode || null,
      gstRate: Number(form.gstRate), categoryName: form.categoryName || null,
      variants: form.variants.map((v) => ({
        id: v.id, sku: v.sku, barcode: v.barcode || null, size: v.size || null, color: v.color || null,
        costPrice: Number(v.costPrice), salePrice: Number(v.salePrice), stock: Number(v.stock), reorderLevel: Number(v.reorderLevel),
      })),
    };
    try {
      if (editingId) await api(`/api/admin/products/${editingId}`, "PUT", body);
      else await api("/api/admin/products", "POST", body);
      setOpen(false);
      await load();
    } catch (e) { setError((e as Error).message); }
    setSaving(false);
  }

  async function remove(p: Product) {
    if (!confirm(`Remove "${p.name}"? If it has billing history it will be hidden instead of deleted.`)) return;
    try { await api(`/api/admin/products/${p.id}`, "DELETE"); await load(); }
    catch (e) { setError((e as Error).message); }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-indigo">Products</h1>
        <button onClick={startNew} className="rounded-md bg-indigo px-4 py-2 text-sm font-medium text-white hover:bg-indigo-dark">+ Add product</button>
      </div>
      {error && !open && <p className="mt-3 text-sm text-madder">{error}</p>}

      {open && (
        <form onSubmit={submit} className="mt-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-semibold text-indigo">{editingId ? "Edit product" : "New product"}</h2>
          {error && <p role="alert" className="mt-2 text-sm text-madder">{error}</p>}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">Name
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm font-medium">Category
              <input value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                placeholder="e.g. Sarees" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm font-medium">HSN code
              <input value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm font-medium">GST rate (%)
              <input type="number" step="0.01" min="0" max="28" required value={form.gstRate}
                onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm font-medium sm:col-span-2">Description
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" rows={2} />
            </label>
          </div>

          <h3 className="mt-5 text-sm font-semibold text-indigo">Variants</h3>
          <div className="mt-2 space-y-3">
            {form.variants.map((v, i) => (
              <div key={i} className="rounded-md border border-slate-200 p-3">
                <div className="grid gap-2 sm:grid-cols-4">
                  <input required placeholder="SKU *" value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                  <input placeholder="Barcode" value={v.barcode} onChange={(e) => updateVariant(i, { barcode: e.target.value })}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                  <input placeholder="Size" value={v.size} onChange={(e) => updateVariant(i, { size: e.target.value })}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                  <input placeholder="Color" value={v.color} onChange={(e) => updateVariant(i, { color: e.target.value })}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-4">
                  <input required type="number" step="0.01" min="0" placeholder="Cost price *" value={v.costPrice}
                    onChange={(e) => updateVariant(i, { costPrice: e.target.value })}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                  <input required type="number" step="0.01" min="0.01" placeholder="Sale price *" value={v.salePrice}
                    onChange={(e) => updateVariant(i, { salePrice: e.target.value })}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                  <input required type="number" min="0" placeholder="Stock" value={v.stock}
                    onChange={(e) => updateVariant(i, { stock: e.target.value })}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                  <input required type="number" min="0" placeholder="Reorder level" value={v.reorderLevel}
                    onChange={(e) => updateVariant(i, { reorderLevel: e.target.value })}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
                {form.variants.length > 1 && (
                  <button type="button" onClick={() => removeVariant(i)} className="mt-2 text-xs font-medium text-madder hover:underline">
                    Remove this variant
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addVariant} className="mt-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
            + Add variant
          </button>

          <div className="mt-5 flex gap-2">
            <button disabled={saving} className="rounded-md bg-indigo px-4 py-2 text-sm font-medium text-white hover:bg-indigo-dark disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-black/5">
        {loading ? (
          <p className="p-5 text-sm text-slate-500">Loading...</p>
        ) : products.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No products yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-2">Product</th><th className="px-4 py-2">Category</th><th className="px-4 py-2">Variants</th><th className="px-4 py-2">Stock</th><th className="px-4 py-2"></th></tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
                const low = p.variants.some((v) => v.stock <= v.reorderLevel);
                return (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2 text-slate-500">{p.category?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-500">{p.variants.length}</td>
                    <td className="px-4 py-2">
                      <span className={low ? "font-medium text-madder" : ""}>{totalStock}</span>
                      {low && <span className="ml-1 text-xs text-madder">low</span>}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => startEdit(p)} className="mr-3 text-indigo hover:underline">Edit</button>
                      <button onClick={() => remove(p)} className="text-madder hover:underline">Remove</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
