import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { isResponse, requireRole } from "@/lib/auth";
import { fail, isUniqueError, str } from "@/lib/server";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const s = await requireRole("ADMIN");
  if (isResponse(s)) return s;
  const b = await req.json().catch(() => ({}));
  const name = str(b.name);
  const email = str(b.email)?.toLowerCase();
  const role = b.role === "ADMIN" ? "ADMIN" : "STAFF";
  const active = b.active !== false;
  if (!name || !email) return fail("Enter a name and email");
  if (params.id === s.uid && (!active || role !== "ADMIN")) return fail("You can't deactivate or demote your own account");

  const data: { name: string; email: string; role: "ADMIN" | "STAFF"; active: boolean; passwordHash?: string } = {
    name, email, role, active,
  };
  if (typeof b.password === "string" && b.password) {
    if (b.password.length < 6) return fail("Password must be at least 6 characters");
    data.passwordHash = await bcrypt.hash(b.password, 10);
  }
  try {
    await db.user.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isUniqueError(e)) return fail("That email is already registered", 409);
    throw e;
  }
}
