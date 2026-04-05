import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  addSession,
  getSessions,
  type Session,
} from "../../../lib/storage";

const AGENT_URL = process.env.ELIZA_API_URL || "http://localhost:3001";
const AGENT_ID = process.env.ELIZA_AGENT_ID || "aya";

// Trigger journal generation via ElizaOS WRITE_JOURNAL action.
// Fire-and-forget — runs in background after session save.
async function triggerJournal(userId: string, sessionCount: number) {
  if (sessionCount < 2) return;
  try {
    await fetch(`${AGENT_URL}/${AGENT_ID}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "[MODE:JOURNAL] Generate a weekly reflection based on recent sessions.",
        userName: "system",
        userId,
        roomId: `journal-${userId}`,
      }),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    // silently fail — journal is non-critical
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await req.json();
    const { question, answer, response, lang } = body;

    if (!question || !answer || !lang) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    const userSession: Session = {
      id: Math.random().toString(36).slice(2, 10),
      date: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
      question,
      answer,
      response: response || "",
      lang,
    };

    addSession(userSession, userId);

    // Fire-and-forget: route journal generation through ElizaOS WRITE_JOURNAL action
    const sessions = getSessions(7, userId);
    triggerJournal(userId, sessions.length).catch(() => {});

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Failed to save session" }, { status: 500 });
  }
}
