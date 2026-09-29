import Link from "next/link";
import { getSession } from "@/lib/auth";

const cards = [
  { href: "/admin/products", title: "Products", desc: "Manage products, variants and stock" },
  { href: "/admin/suppliers", title: "Suppliers", desc: "Manage suppliers and purchase sources" },
  { href: "/admin/staff", title: "Staff", desc: "Manage staff and admin accounts" },
  { href: "/billing", title: "Billing counter", desc: "Open the billing screen" },
];

export default async function AdminHome() {
  const s = await getSession();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-indigo">Welcome, {s?.name}</h1>
      <p className="mt-1 text-slate-500">Pick a section to manage.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5 hover:ring-indigo">
            <h2 className="font-semibold text-indigo">{c.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
