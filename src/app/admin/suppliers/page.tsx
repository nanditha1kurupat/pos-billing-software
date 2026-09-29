"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type Supplier = { id: string; name: string; phone: string | null; email: string | null; address: string | null; gstin: string | null; _count: { purchases: number } };
const emptyForm = () => ({ name: "", phone: "", email: "", address: "", gstin: "" });

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { setSuppliers(await api<Supplier[]>("/api/admin/suppliers")); }
    catch (e) { setError((e as Error).message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function startNew() { setEditingId(null); setForm(emptyForm()); setOpen(true); setError(""); }
  function startEdit(s: Supplier) {
    setEditingId(s.id);
    setForm({ name: s.name, phone: s.phone ?? "", email: s.email ?? "", address: s.address ?? "", gstin: s.gstin ?? "" });
    setOpen(true); setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      if (editingId) await api(`/api/admin/suppliers/${editingId}`, "PUT", form);
      else await api("/api/admin/suppliers", "POST", form);
      setOpen(false);
      await load();
    } catch (e) { setError((e as Error).message); }
    setSaving(false);
  }

  async function remove(s: Supplier) {
    if (!confirm(`Remove "${s.name}"? If it has purchase history it will be hidden instead of deleted.`)) return;
    try { await api(`/api/admin/suppliers/${s.id}`, "DELETE"); await load(); }
    catch (e) { setError((e as Error).message); }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-indigo">Suppliers</h1>
        <button onClick={startNew} className="rounded-md bg-indigo px-4 py-2 text-sm font-medium text-white hover:bg-indigo-dark">+ Add supplier</button>
      </div>
      {error && !open && <p className="mt-3 text-sm text-madder">{error}</p>}

      {open && (
        <form onSubmit={submit} className="mt-4 max-w-md rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-semibold text-indigo">{editingId ? "Edit supplier" : "New supplier"}</h2>
          {error && <p role="alert" className="mt-2 text-sm text-madder">{error}</p>}
          <label className="mt-3 block text-sm font-medium">Name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="mt-3 block text-sm font-medium">Phone
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="mt-3 block text-sm font-medium">Email
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="mt-3 block text-sm font-medium">GSTIN
            <input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="mt-3 block text-sm font-medium">Address
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" rows={2} />
          </label>
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
        ) : suppliers.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No suppliers yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Phone</th><th className="px-4 py-2">GSTIN</th><th className="px-4 py-2">Purchases</th><th className="px-4 py-2"></th></tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{s.name}</td>
                  <td className="px-4 py-2 text-slate-500">{s.phone ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-500">{s.gstin ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-500">{s._count.purchases}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => startEdit(s)} className="mr-3 text-indigo hover:underline">Edit</button>
                    <button onClick={() => remove(s)} className="text-madder hover:underline">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
