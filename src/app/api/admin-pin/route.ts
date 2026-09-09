import { NextRequest, NextResponse } from "next/server";

// PIN lives server-side only — never sent to the client
const ADMIN_PIN = process.env.ADMIN_PIN ?? "260203";

export async function POST(req: NextRequest) {
  let pin: string | undefined;
  try {
    const body = await req.json() as { pin?: string };
    pin = body?.pin;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!pin || pin !== ADMIN_PIN) {
    return NextResponse.json({ error: "invalid_pin" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("yesp_admin_pin", "ok", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return res;
}
