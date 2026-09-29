import { NextResponse } from "next/server";

export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

export function isUniqueError(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}
