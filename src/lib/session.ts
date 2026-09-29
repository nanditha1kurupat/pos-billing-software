// Edge-safe: used by middleware and route handlers
import { SignJWT, jwtVerify } from "jose";

export type Role = "ADMIN" | "STAFF";
export type Session = { uid: string; name: string; role: Role };

export const COOKIE = "pos_token";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-change-me-dev-secret-change");

export async function signSession(s: Session) {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .sign(secret());
}

export async function verifySession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { uid: String(payload.uid), name: String(payload.name), role: payload.role as Role };
  } catch {
    return null;
  }
}
