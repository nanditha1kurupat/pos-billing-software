"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not sign in");
      setBusy(false);
      return;
    }
    router.replace(next && next.startsWith("/") ? next : data.role === "ADMIN" ? "/admin" : "/billing");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h1 className="text-xl font-semibold text-indigo">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500">Admins manage the store. Staff run the billing counter.</p>
      <label className="mt-5 block text-sm font-medium">Email
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base" autoComplete="username" />
      </label>
      <label className="mt-4 block text-sm font-medium">Password
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base" autoComplete="current-password" />
      </label>
      {error && <p role="alert" className="mt-3 text-sm text-madder">{error}</p>}
      <button disabled={busy} className="mt-5 w-full rounded-md bg-indigo px-4 py-2.5 font-medium text-white hover:bg-indigo-dark disabled:opacity-60">
        {busy ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Suspense><LoginForm /></Suspense>
    </main>
  );
}
