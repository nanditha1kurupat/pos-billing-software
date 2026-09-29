import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { COOKIE, signSession } from "@/lib/session";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return NextResponse.json({ error: "Enter email and password" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
  const ok = user && user.active && (await bcrypt.compare(String(password), user.passwordHash));
  if (!user || !ok) return NextResponse.json({ error: "Wrong email or password" }, { status: 401 });

  const token = await signSession({ uid: user.id, name: user.name, role: user.role });
  const res = NextResponse.json({ role: user.role, name: user.name });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
