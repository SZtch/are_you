import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { toUUID } from "./utils";

const googleEnabled =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const authOptions: NextAuthOptions = {
  providers: googleEnabled
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      ]
    : [],
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

const GUEST_ID_RE = /^[a-f0-9]{32}$/;

export async function resolveUserId(req: NextRequest): Promise<string | null> {
  // Google session takes priority (only if Google auth is configured)
  if (googleEnabled) {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) return toUUID(session.user.id);
  }

  // Guest cookie fallback — primary path when Google auth is not configured
  const guestId = req.cookies.get("oneq_guest_id")?.value;
  if (guestId && GUEST_ID_RE.test(guestId)) return toUUID(`guest:${guestId}`);

  return null;
}
