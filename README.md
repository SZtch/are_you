# Sentinel — Solana Wallet Security Agent

![Sentinel](./assets/NosanaXEliza.jpg)

**Sentinel** is an AI-powered Solana wallet security agent built with ElizaOS and deployed on Nosana decentralized GPU infrastructure.

It scans your wallet for dangerous token delegates and approvals, explains the risks in plain language, and guides you through revoking them — running 24/7 on decentralized compute you control.

> "In 2026, AI drainers hunt wallets autonomously. Sentinel fights back."

---

## What It Does

- **Scan** — Detects all active token delegates in your Solana wallet via on-chain RPC
- **Assess** — Classifies each delegate as High Risk or Medium Risk based on allowance size
- **Explain** — Uses Qwen3.5-27B via Nosana to explain risks in plain human language
- **Guide** — Provides step-by-step revoke instructions for dangerous delegates

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Agent Framework | ElizaOS v1.7 |
| LLM | Qwen3.5-27B via Nosana |
| Blockchain | Solana web3.js |
| Frontend | Next.js 15 + Tailwind |
| Compute | Nosana Decentralized GPU |

---

## Getting Started

### Prerequisites
- Node.js 23+
- npm or bun

### Setup

```bash
# Clone and install
git clone https://github.com/SZtch/sentinel
cd sentinel
npm install

# Configure environment
cp .env.example .env
# Fill in your Nosana endpoint and Solana RPC URL

# Run frontend
npm run dev

# Run ElizaOS agent (separate terminal)
npm run dev:agent
```

Open [http://localhost:3000](http://localhost:3000) to use the dashboard.

---

## Environment Variables

```env
OPENAI_API_KEY=nosana
OPENAI_BASE_URL=https://your-nosana-endpoint.node.k8s.prd.nos.ci/v1
OPENAI_SMALL_MODEL=Qwen/Qwen3.5-4B
OPENAI_LARGE_MODEL=Qwen/Qwen3.5-4B
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

---

## Deploy to Nosana

```bash
# Build Docker image
docker build -t yourusername/sentinel:latest .

# Push to Docker Hub
docker push yourusername/sentinel:latest

# Deploy via Nosana dashboard
# https://dashboard.nosana.com/deploy
```

Update `nos_job_def/nosana_eliza_job_definition.json` with your Docker image name before deploying.

---

## Why Nosana?

Sentinel runs 24/7 monitoring wallets — this requires reliable, always-on compute. Nosana's decentralized GPU network provides exactly that, without the centralized control of AWS or GCP. Your agent runs on infrastructure you own, not infrastructure that owns you.

---

## Roadmap

- [ ] Wallet connection via Privy (no Phantom required)
- [ ] One-click on-chain revoke transaction
- [ ] 24/7 autonomous monitoring with Telegram alerts
- [ ] Token name resolution (USDC, SOL instead of mint addresses)
- [ ] Multi-wallet dashboard

---

## Submission

Built for the **Nosana x ElizaOS Builders Challenge** on Superteam Earn.

- GitHub: [github.com/SZtch/sentinel](https://github.com/SZtch/sentinel)
- Built with ElizaOS · Deployed on Nosana · Powered by Qwen3.5
