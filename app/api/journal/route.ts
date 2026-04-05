import { getSessions, getLatestJournal, getStreak } from "../../../lib/storage";

export async function GET() {
  try {
    const sessions = getSessions(30);
    const streak = getStreak(sessions);
    const journal = getLatestJournal();
    const totalSessions = sessions.length;

    return Response.json({
      streak,
      totalSessions,
      journal: journal
        ? { week: journal.week, content: journal.content, sessionCount: journal.sessionCount }
        : null,
    });
  } catch {
    return Response.json({ streak: 0, totalSessions: 0, journal: null });
  }
}
