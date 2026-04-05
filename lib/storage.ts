// Next.js side storage — reads/writes the same data/solace.json as the plugin
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export type Session = {
  id: string;
  date: string;
  timestamp: number;
  question: string;
  answer: "yes" | "no";
  response: string;
  lang: "id" | "en";
};

export type JournalEntry = {
  week: string;
  content: string;
  generatedAt: number;
  sessionCount: number;
};

type StorageData = { sessions: Session[]; journal: JournalEntry[] };

const DATA_DIR = join(process.cwd(), "data");
const FILE = join(DATA_DIR, "solace.json");

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function load(): StorageData {
  ensureDir();
  if (!existsSync(FILE)) return { sessions: [], journal: [] };
  try { return JSON.parse(readFileSync(FILE, "utf-8")); }
  catch { return { sessions: [], journal: [] }; }
}

function save(data: StorageData) {
  ensureDir();
  writeFileSync(FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function addSession(session: Session) {
  const data = load();
  data.sessions.push(session);
  save(data);
}

export function getSessions(limit = 30): Session[] {
  return load().sessions.slice(-limit);
}

export function getLatestJournal(): JournalEntry | null {
  const entries = load().journal;
  return entries.length ? entries[entries.length - 1] : null;
}

export function addJournalEntry(entry: JournalEntry) {
  const data = load();
  const idx = data.journal.findIndex(j => j.week === entry.week);
  if (idx >= 0) data.journal[idx] = entry;
  else data.journal.push(entry);
  save(data);
}

export function getStreak(sessions: Session[]): number {
  if (!sessions.length) return 0;
  const uniqueDates = [...new Set(sessions.map(s => s.date))].sort().reverse();
  const now = new Date();
  let streak = 0;
  for (let i = 0; i < uniqueDates.length; i++) {
    const expected = new Date(now);
    expected.setDate(now.getDate() - i);
    if (uniqueDates[i] === expected.toISOString().split("T")[0]) streak++;
    else break;
  }
  return streak;
}

export function getCurrentWeek(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
