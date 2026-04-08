# syntax=docker/dockerfile:1

FROM node:23-slim AS base

RUN apt-get update && apt-get install -y \
  python3 make g++ git curl unzip \
  && rm -rf /var/lib/apt/lists/*

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

ENV ELIZAOS_TELEMETRY_DISABLED=true
ENV DO_NOT_TRACK=1

WORKDIR /app

# ── Install dependencies ──
COPY package.json ./
COPY plugin/package.json ./plugin/
RUN bun install

# ── Copy all source ──
COPY . .

# ── Build Next.js ──
RUN bun run build

# ── Runtime directories ──
RUN mkdir -p /app/data

# ── Ports ──
# 3000 → Next.js frontend (public-facing)
# 3001 → ElizaOS agent   (internal, proxied via /api/chat)
EXPOSE 3000

# ── Environment ──
ENV NODE_ENV=production

# ElizaOS agent port — must NOT conflict with Next.js (3000)
ENV SERVER_PORT=3001
ENV ELIZA_API_URL=http://localhost:3001
ENV ELIZA_AGENT_ID=30c8adf3-1590-0456-aed5-9c78c439c205

# ── Start both processes ──
# Starts ElizaOS agent in background, waits up to 120s for its health endpoint,
# then starts Next.js. If the agent never becomes healthy the container exits
# so Docker's restart policy can recover it instead of hanging indefinitely.
CMD ["sh", "-c", "\
  SERVER_PORT=3001 bun run start:agent & \
  AGENT_PID=$!; \
  elapsed=0; \
  until curl -sf http://localhost:3001/api/server/health > /dev/null 2>&1; do \
    sleep 2; \
    elapsed=$((elapsed + 2)); \
    if [ $elapsed -ge 120 ]; then \
      echo '[startup] ERROR: Eliza agent did not become healthy within 120s — exiting'; \
      kill $AGENT_PID 2>/dev/null; \
      exit 1; \
    fi; \
  done && \
  echo '[startup] Eliza agent healthy — starting Next.js' && \
  bun run start\
"]
