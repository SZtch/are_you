import { NextRequest } from "next/server";
import { resolveUserId } from "@/lib/auth";
import {
  addSession,
  getSessions,
  addJournalEntry,
  getCurrentWeek,
  type Session,
} from "../../../lib/storage";

const OPENAI_API_URL = process.env.OPENAI_API_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "nosana";
const MODEL_NAME = process.env.MODEL_NAME || "Qwen/Qwen3.5-27B-AWQ-4bit";

async function generateAndSaveJournal(userId: string) {
  if (!OPENAI_API_URL) return;

  const sessions = getSessions(7, userId);
  if (sessions.length < 2) return;

  const week = getCurrentWeek();
  const summary = sessions
    .map((s) => `${s.date}: "${s.question}" → ${s.answer}`)
    .join("\n");

  const prompt = `Based on this week's emotional check-ins, write a quiet poetic reflection in 3-4 lines.\nStyle: lowercase, warm, honest, no advice — just witness what the week held.\nDo not use quotes, lists, or greetings. Return only the reflection itself.\n\nSessions:\n${summary}`;

  try {
    const res = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.85,
        max_tokens: 150,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) return;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (content) {
      addJournalEntry(
        {
          week,
          content,
          generatedAt: Date.now(),
          sessionCount: sessions.length,
        },
        userId
      );
    }
  } catch {
    // silently fail — journal is non-critical
  }
}

export async function POST(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { question, answer, response, lang } = body;

    if (!question || !answer || !lang) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!["yes", "no"].includes(answer)) {
      return Response.json({ error: "Invalid answer" }, { status: 400 });
    }

    if (!["id", "en"].includes(lang)) {
      return Response.json({ error: "Invalid lang" }, { status: 400 });
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

    generateAndSaveJournal(userId).catch(() => {});

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Failed to save session" }, { status: 500 });
  }
}
