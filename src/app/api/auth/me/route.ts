import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const s = await getSession();
  return s ? NextResponse.json(s) : NextResponse.json({ error: "Not signed in" }, { status: 401 });
}
