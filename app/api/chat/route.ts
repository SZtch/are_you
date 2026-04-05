import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toUUID } from '@/lib/utils'

const AGENT_URL = process.env.ELIZA_API_URL || 'http://localhost:3001'
const AGENT_ID  = process.env.ELIZA_AGENT_ID  || '30c8adf3-1590-0456-aed5-9c78c439c205'

// In-memory session cache per userId
const sessionCache = new Map<string, { sessionId: string; expiresAt: number }>()

async function getOrCreateSession(userId: string): Promise<string> {
  const cached = sessionCache.get(userId)
  const now = Date.now()

  // Reuse cached session if still valid (5 min buffer before expiry)
  if (cached && cached.expiresAt > now + 5 * 60 * 1000) {
    return cached.sessionId
  }

  const res = await fetch(`${AGENT_URL}/api/messaging/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId: AGENT_ID, userId: toUUID(userId) }),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) throw new Error(`Session create failed: ${res.status}`)
  const data = await res.json()

  sessionCache.set(userId, {
    sessionId: data.sessionId,
    expiresAt: data.expiresAt
      ? new Date(data.expiresAt).getTime()
      : Date.now() + 60 * 60 * 1000, // fallback: 1 hour
  })

  return data.sessionId
}

async function pollForReply(sessionId: string, sentAt: number, maxWait = 15000): Promise<string | null> {
  const deadline = Date.now() + maxWait

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 1200))

    const res = await fetch(`${AGENT_URL}/api/messaging/sessions/${sessionId}/messages`)
    if (!res.ok) continue

    const data = await res.json()
    const agentMsgs = (data.messages || []).filter(
      (m: { isAgent: boolean; createdAt: string; content: string | { text?: string } }) =>
        m.isAgent && new Date(m.createdAt).getTime() > sentAt
    )

    if (agentMsgs.length > 0) {
      const raw = agentMsgs[agentMsgs.length - 1].content
      // ElizaOS v2 may return content as { text: string } or plain string
      return typeof raw === 'string' ? raw : (raw as { text?: string })?.text ?? ''
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { text?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.text?.trim()) {
    return Response.json({ error: 'Message text is required' }, { status: 400 })
  }

  try {
    const sessionId = await getOrCreateSession(session.user.id)
    const sentAt = Date.now()

    const msgRes = await fetch(`${AGENT_URL}/api/messaging/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: body.text }),
      signal: AbortSignal.timeout(10000),
    })

    if (!msgRes.ok) {
      // Session might have expired — clear cache
      sessionCache.delete(session.user.id)
      const txt = await msgRes.text().catch(() => '')
      return Response.json({ error: `Session error ${msgRes.status}`, detail: txt }, { status: msgRes.status })
    }

    const reply = await pollForReply(sessionId, sentAt)

    if (reply === null) {
      return Response.json({ error: 'Agent did not respond in time' }, { status: 504 })
    }

    return Response.json([{ text: reply }])
  } catch (err) {
    console.error('[/api/chat] Error:', err)
    return Response.json({ error: 'Agent unreachable' }, { status: 503 })
  }
}

export async function GET() {
  try {
    const res = await fetch(`${AGENT_URL}/api/server/health`)
    const status = res.ok ? 'connected' : 'degraded'
    return Response.json({ status, agentUrl: AGENT_URL, agentId: AGENT_ID })
  } catch {
    return Response.json({ status: 'offline', agentUrl: AGENT_URL, agentId: AGENT_ID }, { status: 503 })
  }
}

