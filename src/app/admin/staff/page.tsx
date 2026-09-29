"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type Staff = { id: string; name: string; email: string; role: "ADMIN" | "STAFF"; active: boolean };
const emptyForm = () => ({ name: "", email: "", password: "", role: "STAFF" as "ADMIN" | "STAFF", active: true });

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { setStaff(await api<Staff[]>("/api/admin/staff")); }
    catch (e) { setError((e as Error).message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function startNew() { setEditingId(null); setForm(emptyForm()); setOpen(true); setError(""); }
  function startEdit(u: Staff) {
    setEditingId(u.id);
    setForm({ name: u.name, email: u.email, password: "", role: u.role, active: u.active });
    setOpen(true); setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const body: Record<string, unknown> = { name: form.name, email: form.email, role: form.role, active: form.active };
    if (form.password) body.password = form.password;
    try {
      if (editingId) await api(`/api/admin/staff/${editingId}`, "PUT", body);
      else await api("/api/admin/staff", "POST", { ...body, password: form.password });
      setOpen(false);
      await load();
    } catch (e) { setError((e as Error).message); }
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-indigo">Staff</h1>
        <button onClick={startNew} className="rounded-md bg-indigo px-4 py-2 text-sm font-medium text-white hover:bg-indigo-dark">+ Add account</button>
      </div>
      {error && !open && <p className="mt-3 text-sm text-madder">{error}</p>}

      {open && (
        <form onSubmit={submit} className="mt-4 max-w-md rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-semibold text-indigo">{editingId ? "Edit account" : "New account"}</h2>
          {error && <p role="alert" className="mt-2 text-sm text-madder">{error}</p>}
          <label className="mt-3 block text-sm font-medium">Name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="mt-3 block text-sm font-medium">Email
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="mt-3 block text-sm font-medium">{editingId ? "New password (leave blank to keep current)" : "Password"}
            <input type="password" required={!editingId} minLength={6} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="mt-3 block text-sm font-medium">Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "STAFF" })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          {editingId && (
            <label className="mt-3 flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Active (can sign in)
            </label>
          )}
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
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Role</th><th className="px-4 py-2">Status</th><th className="px-4 py-2"></th></tr>
            </thead>
            <tbody>
              {staff.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{u.name}</td>
                  <td className="px-4 py-2 text-slate-500">{u.email}</td>
                  <td className="px-4 py-2">{u.role}</td>
                  <td className="px-4 py-2">{u.active ? "Active" : <span className="text-madder">Inactive</span>}</td>
                  <td className="px-4 py-2 text-right"><button onClick={() => startEdit(u)} className="text-indigo hover:underline">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
