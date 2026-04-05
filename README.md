# oneQ

![Nosana x ElizaOS](./assets/NosanaXEliza.jpg)

**oneQ** is a quiet emotional companion built with ElizaOS v2, deployed on Nosana's decentralized GPU network.

It asks you one introspective question a day. You answer yes or no. It listens, responds with warmth, and after enough sessions — writes you a weekly reflection without being asked.

> "are you carrying something heavy today?"

No advice. No dashboards. Just presence.

---

## How It Works

Every session flows through three steps:

1. **Question** — Aya generates a short introspective question via Qwen3.5-27B on Nosana GPU. Bilingual: Indonesian or English, auto-detected.
2. **Response** — You answer yes or no. Aya writes a 3–5 line empathetic reply shaped by your emotional history (via `EMOTIONAL_MEMORY` provider, injected on every message).
3. **Reflection** — After each session, `WRITE_JOURNAL` action fires autonomously. If you've answered enough times this week, Aya writes a quiet weekly journal entry — no prompt from you.

Guest mode is available. No account required to try it.

---

## Stack

| Layer | Tech |
|---|---|
| Agent | ElizaOS v2 |
| LLM | Qwen/Qwen3.5-27B-AWQ-4bit via Nosana |
| Plugin | `solace-plugin` — custom provider + action |
| Frontend | Next.js 15 + React 19 |
| Auth | NextAuth (Google OAuth + guest cookie) |
| Storage | JSON per user (`data/{userId}.json`) |
| Compute | Nosana Decentralized GPU |

```
[Browser]
  ↓ POST /api/chat     → question / response / chat
  ↓ POST /api/session  → save answer + trigger journal async
  ↓ GET  /api/journal  → fetch streak + weekly reflection
[Next.js — port 3000]
  ↓ proxy
[ElizaOS — port 3001]  ← Aya + solace-plugin
  ↓ EMOTIONAL_MEMORY provider (every message)
  ↓ WRITE_JOURNAL action (after each session)
  ↓
[Qwen3.5-27B on Nosana GPU]
```

---

## Local Setup

```bash
git clone https://github.com/SZtch/oneQ
cd oneQ

bun install

cp .env.example .env
# Fill in NEXTAUTH_SECRET at minimum (see .env.example)
# GOOGLE_CLIENT_ID / SECRET are optional — guest mode works without them

# Terminal 1 — ElizaOS agent (port 3001)
bun run dev:agent

# Terminal 2 — Next.js (port 3000)
bun run dev
```

Open http://localhost:3000 — click "continue as guest" to try without Google.

---

## Deploy to Nosana

```bash
# Build and push your image
docker build -t sztch/oneq:latest .
docker push sztch/oneq:latest

# Fill in nos_job_def/nosana_eliza_job_definition.json:
# - NEXTAUTH_SECRET  (openssl rand -base64 32)
# - NEXTAUTH_URL     (your Nosana deployment URL)
# - GOOGLE_CLIENT_ID / SECRET  (optional)

# Deploy via
# https://deploy.nosana.com
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | yes | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | yes | App base URL |
| `OPENAI_API_KEY` | yes | Set to `nosana` |
| `OPENAI_API_URL` | yes | Nosana inference endpoint |
| `OPENAI_BASE_URL` | yes | Same as above |
| `MODEL_NAME` | yes | `Qwen/Qwen3.5-27B-AWQ-4bit` |
| `SERVER_PORT` | yes | `3001` (Eliza, must not conflict with Next.js) |
| `ELIZA_API_URL` | yes | `http://localhost:3001` |
| `ELIZA_AGENT_ID` | yes | `30c8adf3-1590-0456-aed5-9c78c439c205` |
| `GOOGLE_CLIENT_ID` | no | Google OAuth — app works without it |
| `GOOGLE_CLIENT_SECRET` | no | Google OAuth — app works without it |

> **Note:** `data/{userId}.json` is ephemeral on Nosana — sessions reset on container restart. Known MVP limitation.

---

Built for the **Nosana x ElizaOS Builders' Challenge** — Superteam Earn.  
`#NosanaAgentChallenge`

