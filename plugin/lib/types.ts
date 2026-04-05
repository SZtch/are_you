export type Session = {
  id: string;
  date: string;       // YYYY-MM-DD
  timestamp: number;
  question: string;
  answer: "yes" | "no";
  response: string;
  lang: "id" | "en";
};

export type JournalEntry = {
  week: string;       // YYYY-Www
  content: string;
  generatedAt: number;
  sessionCount: number;
};

export type StorageData = {
  sessions: Session[];
  journal: JournalEntry[];
};

export type EmotionalTrend = "declining" | "stable" | "positive";
