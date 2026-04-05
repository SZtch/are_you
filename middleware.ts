import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const GUEST_ID_RE = /^[a-f0-9]{32}$/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Google JWT
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  // Guest cookie
  const guestId = req.cookies.get("oneq_guest_id")?.value;
  if (guestId && GUEST_ID_RE.test(guestId)) return NextResponse.next();

  // Unauthed
  if (pathname.startsWith("/api/")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/", req.url));
}

export const config = {
  matcher: [
    "/app/:path*",
    "/api/chat/:path*",
    "/api/session/:path*",
    "/api/journal/:path*",
  ],
};
