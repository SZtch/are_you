# syntax=docker/dockerfile:1

FROM node:23-slim AS base

RUN apt-get update && apt-get install -y \
  python3 make g++ git curl \
  && rm -rf /var/lib/apt/lists/*

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

ENV ELIZAOS_TELEMETRY_DISABLED=true
ENV DO_NOT_TRACK=1

WORKDIR /app

# Install deps
COPY package.json ./
RUN npm install

# Copy all source
COPY . .

# Build Next.js
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

ENV NODE_ENV=production
ENV SERVER_PORT=3000

# Start both Next.js and ElizaOS agent
CMD ["sh", "-c", "npm run start:agent & npm run start"]
