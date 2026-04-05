import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST() {
  const guestId = randomBytes(16).toString("hex");
  const res = NextResponse.json({ ok: true });
  res.cookies.set("oneq_guest_id", guestId, {
    httpOnly: false, // client needs to read this to detect guest mode
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
