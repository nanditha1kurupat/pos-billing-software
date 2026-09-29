// Server-side guards for route handlers (defense in depth on top of middleware)
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE, Role, Session, verifySession } from "./session";

export async function getSession(): Promise<Session | null> {
  return verifySession(cookies().get(COOKIE)?.value);
}

export async function requireRole(...roles: Role[]): Promise<Session | NextResponse> {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!roles.includes(s.role)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  return s;
}

export const isResponse = (v: Session | NextResponse): v is NextResponse => v instanceof NextResponse;
