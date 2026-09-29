import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { isResponse, requireRole } from "@/lib/auth";
import { fail, isUniqueError, str } from "@/lib/server";

const select = { id: true, name: true, email: true, role: true, active: true, createdAt: true } as const;

export async function GET() {
  const s = await requireRole("ADMIN");
  if (isResponse(s)) return s;
  return NextResponse.json(await db.user.findMany({ select, orderBy: { createdAt: "asc" } }));
}

export async function POST(req: Request) {
  const s = await requireRole("ADMIN");
  if (isResponse(s)) return s;
  const b = await req.json().catch(() => ({}));
  const name = str(b.name);
  const email = str(b.email)?.toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const role = b.role === "ADMIN" ? "ADMIN" : "STAFF";
  if (!name || !email) return fail("Enter a name and email");
  if (password.length < 6) return fail("Password must be at least 6 characters");
  try {
    const user = await db.user.create({
      data: { name, email, role, passwordHash: await bcrypt.hash(password, 10) },
      select,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    if (isUniqueError(e)) return fail("That email is already registered", 409);
    throw e;
  }
}
