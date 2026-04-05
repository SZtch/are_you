import { NextRequest } from "next/server";
import { resolveUserId } from "@/lib/auth";
import { getSessions, getLatestJournal, getStreak } from "../../../lib/storage";

export async function GET(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = getSessions(30, userId);
    const streak = getStreak(sessions);
    const journal = getLatestJournal(userId);

    return Response.json({
      streak,
      journal: journal
        ? { week: journal.week, content: journal.content, sessionCount: journal.sessionCount }
        : null,
    });
  } catch {
    return Response.json({ streak: 0, journal: null });
  }
}
