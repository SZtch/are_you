'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'

// ── Custom SVG Icons ─────────────────────────────────────────
function IconBack() {
  return (
    <svg width="18" height="8" viewBox="0 0 18 8" fill="none" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round">
      <line x1="17" y1="4" x2="1" y2="4" />
      <line x1="1" y1="4" x2="4" y2="1.5" />
      <line x1="1" y1="4" x2="4" y2="6.5" />
    </svg>
  )
}

function IconRetry() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round">
      <path d="M7 1.5 A5.5 5.5 0 1 0 12.5 7" />
      <line x1="12.5" y1="7" x2="12.5" y2="3" />
      <line x1="12.5" y1="3" x2="9" y2="3" />
    </svg>
  )
}

function IconSend({ active }: { active: boolean }) {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none"
      stroke={active ? 'rgba(210,175,130,0.7)' : 'rgba(255,255,255,0.1)'}
      strokeWidth="0.75" strokeLinecap="round">
      <line x1="1" y1="7" x2="17" y2="7" />
      <line x1="17" y1="7" x2="12" y2="2.5" />
      <line x1="17" y1="7" x2="12" y2="11.5" />
    </svg>
  )
}

type Lang = 'id' | 'en'
type Answer = 'yes' | 'no'

const STATIC = {
  id: {
    yes: 'ya', no: 'tidak',
    sub: 'jawab dengan jujur',
    back: 'kembali',
    retry: 'pertanyaan lain',
    streak: 'hari',
    thisWeek: 'minggu ini',
    switchTo: 'en',
    chatPrompt: 'ingin cerita lebih?',
    chatPlaceholder: 'cerita saja...',
    chatSend: 'kirim',
    chatClose: 'cukup untuk hari ini',
  },
  en: {
    yes: 'yes', no: 'no',
    sub: 'answer honestly',
    back: 'go back',
    retry: 'new question',
    streak: 'days',
    thisWeek: 'this week',
    switchTo: 'id',
    chatPrompt: 'want to talk about it?',
    chatPlaceholder: 'just talk...',
    chatSend: 'send',
    chatClose: "that's enough for today",
  },
}

const FALLBACK_QUESTIONS = {
  id: ['apakah kamu bahagia?', 'apa yang kamu rasakan hari ini?', 'apakah kamu merasa cukup?', 'masih adakah yang memberatkanmu?'],
  en: ['are you happy?', 'how are you, really?', 'are you at peace today?', 'what are you carrying right now?'],
}

const FALLBACK_RESPONSES = {
  yes: {
    id: ['bagus.', 'pegang itu baik-baik.', 'kebahagiaan sedang bersamamu sekarang.'],
    en: ['good.', 'hold onto it.', 'happiness is with you right now.'],
  },
  no: {
    id: ['tidak apa-apa.', 'cukup ada di sini.', 'itu sudah berani.'],
    en: ["that's okay.", 'just being here is already brave.'],
  },
}

type JournalData = {
  streak: number
  journal: { week: string; content: string; sessionCount: number } | null
}

function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'id'
  const l = navigator.language || ''
  return l.startsWith('id') ? 'id' : 'en'
}

function getTimeContext(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 9)   return 'early morning'
  if (h >= 9 && h < 12)  return 'morning'
  if (h >= 12 && h < 15) return 'afternoon'
  if (h >= 15 && h < 18) return 'late afternoon'
  if (h >= 18 && h < 21) return 'evening'
  return 'night'
}

function LoadingDots() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0c0a09',
      color: 'rgba(168,150,132,0.72)',
      fontStyle: 'italic', fontSize: '13px', letterSpacing: '0.18em',
      animation: 'fadeIn 1s ease both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="dot" />
        <div className="dot" style={{ animationDelay: '0.2s' }} />
        <div className="dot" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}

export default function Home() {
  const { data: session, status } = useSession()
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    if (status !== 'unauthenticated') return
    const hasGuest = document.cookie
      .split(';')
      .some(c => c.trim().startsWith('oneq_guest_id='))
    if (hasGuest) {
      setIsGuest(true)
    } else {
      window.location.href = '/'
    }
  }, [status])

  if (status === 'loading') return <LoadingDots />

  // unauthenticated + no guest cookie = redirect triggered, hold render
  if (status === 'unauthenticated' && !isGuest) return null

  return <AppContent session={session} isGuest={isGuest} />
}

function AppContent({
  session,
  isGuest,
}: {
  session: ReturnType<typeof useSession>['data']
  isGuest: boolean
}) {
  const [lang, setLang] = useState<Lang>('id')
  const [question, setQuestion] = useState('')
  const [questionLoading, setQuestionLoading] = useState(true)
  const [buttonsDisabled, setButtonsDisabled] = useState(true)
  const [hoverSide, setHoverSide] = useState<'yes' | 'no' | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [resultActive, setResultActive] = useState(false)
  const [answerType, setAnswerType] = useState<Answer>('yes')
  const [resultLines, setResultLines] = useState<string[]>([])
  const [resultLoading, setResultLoading] = useState(false)
  const [agentStatus, setAgentStatus] = useState<'idle' | 'connected' | 'error'>('idle')
  const [journalData, setJournalData] = useState<JournalData>({ streak: 0, journal: null })
  const [showJournal, setShowJournal] = useState(false)
  const [showJournalPanel, setShowJournalPanel] = useState(false)
  const [chatMode, setChatMode] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'aya'; text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [showChatPrompt, setShowChatPrompt] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const currentQuestion = useRef('')
  const currentResponse = useRef('')
  const particlesEl = useRef<HTMLDivElement>(null)
  const pInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const langRef = useRef(lang)
  langRef.current = lang

  useEffect(() => {
    setLang(detectLang())
  }, [])

  useEffect(() => {
    fetch('/api/journal').then(r => r.json()).then(setJournalData).catch(() => {})
  }, [])

  const saveSession = useCallback(async (question: string, answer: Answer, response: string, lang: Lang) => {
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, response, lang }),
      })

      // First fetch immediately (optimistic — may not have journal yet)
      const res = await fetch('/api/journal')
      setJournalData(await res.json())

      // Eliza writes journal async, refetch after delay to catch it
      const refetch = async () => {
        const r = await fetch('/api/journal')
        setJournalData(await r.json())
      }
      setTimeout(refetch, 1500)
      setTimeout(refetch, 4000)
    } catch {}
  }, [])

  const callAgent = useCallback(async (text: string): Promise<string> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, userName: 'User' }),
    })
    if (!res.ok) throw new Error(`Agent ${res.status}`)
    const data = await res.json()
    if (Array.isArray(data)) return data.map((d: { text?: string }) => d.text || '').filter(Boolean).join('\n').trim()
    return ((data as { text?: string }).text || '').trim()
  }, [])

  const generateQuestion = useCallback(async (l?: Lang) => {
    const activeLang = l ?? langRef.current
    setQuestion('')
    setQuestionLoading(true)
    setButtonsDisabled(true)
    setShowJournal(false)
    currentQuestion.current = ''

    const time = getTimeContext()
    const prompt = activeLang === 'id'
      ? `[MODE:PERTANYAAN] Waktu: ${time}. Hasilkan SATU pertanyaan introspektif singkat (maks 8 kata) dalam bahasa Indonesia. Tema: kebahagiaan, kehadiran, kesendirian, kedamaian batin. Sesuaikan tone dengan waktu. Hanya pertanyaan saja, tanpa tanda kutip.`
      : `[MODE:QUESTION] Time of day: ${time}. Generate ONE short introspective question (max 8 words). Themes: happiness, presence, loneliness, inner peace. Adjust tone to time. Just the question, no quotes.`

    try {
      let q = await callAgent(prompt)
      q = q.replace(/^["""]|["""]$/g, '').trim()
      if (!q.endsWith('?')) q += '?'
      currentQuestion.current = q
      setQuestion(q)
      setAgentStatus('connected')
    } catch {
      setAgentStatus('error')
      const fallbacks = FALLBACK_QUESTIONS[activeLang]
      const q = fallbacks[Math.floor(Math.random() * fallbacks.length)]
      currentQuestion.current = q
      setQuestion(q)
    } finally {
      setQuestionLoading(false)
      setButtonsDisabled(false)
      const hintTimer = setTimeout(() => setShowHint(true), 600)
      return () => clearTimeout(hintTimer)
    }
  }, [callAgent])

  const generateResponse = useCallback(async (type: Answer) => {
    const activeLang = langRef.current
    const time = getTimeContext()
    setResultLoading(true)
    setResultLines([])
    currentResponse.current = ''

    const prompt = activeLang === 'id'
      ? `[MODE:RESPONS] Waktu: ${time}. Pertanyaan: "${currentQuestion.current}" | Jawaban: ${type === 'yes' ? 'YA' : 'TIDAK'}. Tulis respons empatik singkat (2-4 baris). Gaya: puitis, hangat, sesuai waktu ${time}. Tiap baris dipisah newline.`
      : `[MODE:RESPONSE] Time: ${time}. Question: "${currentQuestion.current}" | Answer: ${type === 'yes' ? 'YES' : 'NO'}. Write a short empathetic response (2-4 lines). Style: poetic, warm, fitting for ${time}. Each line separated by newline.`

    try {
      const text = await callAgent(prompt)
      const lines = text.split('\n').filter(l => l.trim())
      const finalLines = lines.length ? lines : FALLBACK_RESPONSES[type][activeLang]
      currentResponse.current = finalLines.join('\n')
      setResultLines(finalLines)
    } catch {
      const fallback = FALLBACK_RESPONSES[type][activeLang]
      currentResponse.current = fallback.join('\n')
      setResultLines(fallback)
    } finally {
      saveSession(currentQuestion.current, type, currentResponse.current, activeLang)
      setResultLoading(false)
      setTimeout(() => setShowJournal(true), 2000)
      setTimeout(() => setShowChatPrompt(true), 3500)
    }
  }, [callAgent, saveSession])

  const handleAnswer = useCallback(async (type: Answer) => {
    if (buttonsDisabled) return
    setShowHint(false)
    stopParticles()
    setHoverSide(null)
    setAnswerType(type)
    setShowResult(true)
    setResultActive(false)
    setTimeout(() => setResultActive(true), 80)
    if (type === 'yes') startParticles('yes', 3)
    else startParticles('no', 1)
    await generateResponse(type)
  }, [generateResponse, buttonsDisabled])

  const sendChatMessage = useCallback(async () => {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    const activeLang = langRef.current

    setChatMessages(prev => [...prev, { role: 'user', text }])
    setChatInput('')
    setChatLoading(true)

    const modePrefix = activeLang === 'id' ? '[MODE:CURHAT]' : '[MODE:CHAT]'
    const context = currentQuestion.current
      ? `Context — sebelumnya Aya bertanya: "${currentQuestion.current}"`
      : ''
    const prompt = `${modePrefix} ${context}\nUser: ${text}`

    try {
      const reply = await callAgent(prompt)
      setChatMessages(prev => [...prev, { role: 'aya', text: reply }])
    } catch {
      const fallback = activeLang === 'id' ? 'aku di sini.' : "i'm here."
      setChatMessages(prev => [...prev, { role: 'aya', text: fallback }])
    } finally {
      setChatLoading(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [chatInput, chatLoading, callAgent])

  const goBack = useCallback(() => {
    setResultActive(false)
    setShowJournal(false)
    setShowJournalPanel(false)
    setChatMode(false)
    setChatMessages([])
    setChatInput('')
    setShowChatPrompt(false)
    stopParticles()
    setTimeout(() => {
      setShowResult(false)
      generateQuestion()
    }, 800)
  }, [generateQuestion])

  const switchLang = useCallback(() => {
    const next: Lang = langRef.current === 'id' ? 'en' : 'id'
    setLang(next)
    generateQuestion(next)
  }, [generateQuestion])

  function stopParticles() {
    if (pInterval.current) { clearInterval(pInterval.current); pInterval.current = null }
  }

  function spawnParticle(type: Answer) {
    if (!particlesEl.current) return
    const p = document.createElement('div')
    p.className = 'particle'
    const size = Math.random() * 4 + 1
    const dur  = Math.random() * 3 + 2
    const dl   = Math.random() * 0.4
    const warm = type === 'yes'
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;bottom:${Math.random()*30}%;` +
      `background:${warm
        ? `rgba(232,${140+(Math.random()*40|0)},${30+(Math.random()*40|0)},${.4+Math.random()*.4})`
        : `rgba(${60+(Math.random()*40|0)},${100+(Math.random()*40|0)},${140+(Math.random()*30|0)},${.3+Math.random()*.3})`};` +
      `animation-duration:${dur}s;animation-delay:${dl}s;`
    particlesEl.current.appendChild(p)
    setTimeout(() => p.remove(), (dur + dl) * 1000)
  }

  function startParticles(type: Answer, n = 2) {
    stopParticles()
    for (let i = 0; i < 6; i++) spawnParticle(type)
    pInterval.current = setInterval(() => { for (let i = 0; i < n; i++) spawnParticle(type) }, 150)
  }

  useEffect(() => { generateQuestion(); return () => stopParticles() }, [])  // eslint-disable-line

  const s = STATIC[lang]

  const displayName = isGuest ? 'guest' : session?.user?.name?.split(' ')[0]

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .split-screen { display: none !important; }

          .question-float {
            padding: 0 24px !important;
            padding-top: 72px !important;
            padding-bottom: 32px !important;
            pointer-events: all !important;
            justify-content: center !important;
          }

          .question { font-size: clamp(1.8rem, 8vw, 2.6rem) !important; }

          .breathe-line {
            height: 20px !important;
            margin-bottom: 16px !important;
          }

          .sub-question { margin-top: 8px !important; }
          .retry-hint   { margin-top: 14px !important; }

          .mobile-answer-btns {
            display: flex !important;
            gap: 16px !important;
            margin-top: 36px !important;
            width: 100% !important;
            pointer-events: all !important;
          }

          .mobile-answer-btn {
            flex: 1;
            padding: 14px 0;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(112,100,88,0.25);
            border-radius: 4px;
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 0.78rem;
            letter-spacing: 0.42em;
            text-transform: uppercase;
            color: rgba(112,100,88,0.85);
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            transition: background 0.25s, border-color 0.25s, color 0.25s;
          }

          .mobile-answer-btn.yes-btn:active {
            background: rgba(232,160,74,0.1);
            border-color: rgba(232,160,74,0.5);
            color: rgba(232,160,74,0.95);
          }

          .mobile-answer-btn.no-btn:active {
            background: rgba(91,122,138,0.1);
            border-color: rgba(91,122,138,0.5);
            color: rgba(91,122,138,0.95);
          }

          .mobile-answer-btn:disabled { opacity: 0.35; }

          .status-dot { display: none !important; }

          .result {
            padding: 72px 24px 80px !important;
          }
        }
      `}</style>

      <div ref={particlesEl} className="particles" />

      <div
        className="split-screen"
        style={{ opacity: showResult ? 0 : 1, pointerEvents: showResult ? 'none' : 'all' }}
      >
        <div
          role="button"
          tabIndex={buttonsDisabled ? -1 : 0}
          aria-label={s.yes}
          className={`split-half yes-half${hoverSide === 'yes' ? ' active' : ''}`}
          onMouseEnter={() => { if (!buttonsDisabled) { setHoverSide('yes'); startParticles('yes', 2) } }}
          onMouseLeave={() => { setHoverSide(null); stopParticles() }}
          onClick={() => handleAnswer('yes')}
          onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !buttonsDisabled) handleAnswer('yes') }}
        >
          <span className="split-label">{s.yes}</span>
        </div>

        <div className="split-divider" />

        <div
          role="button"
          tabIndex={buttonsDisabled ? -1 : 0}
          aria-label={s.no}
          className={`split-half no-half${hoverSide === 'no' ? ' active' : ''}`}
          onMouseEnter={() => { if (!buttonsDisabled) { setHoverSide('no'); startParticles('no', 1) } }}
          onMouseLeave={() => { setHoverSide(null); stopParticles() }}
          onClick={() => handleAnswer('no')}
          onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !buttonsDisabled) handleAnswer('no') }}
        >
          <span className="split-label">{s.no}</span>
        </div>
      </div>

      <div
        className="question-float"
        style={{ opacity: showResult ? 0 : 1, pointerEvents: 'none' }}
      >
        <div className="breathe-line" />
        <div className="question-wrap">
          {questionLoading ? (
            <div className="question-loading">
              <div className="dot" /><div className="dot" /><div className="dot" />
            </div>
          ) : (
            <>
              <h1 className={`question${hoverSide === 'yes' ? ' warm' : hoverSide === 'no' ? ' cool' : ''}`}>
                {question}
              </h1>
              <p className="sub-question">{s.sub}</p>
              <div
                className="retry-hint"
                style={{ pointerEvents: 'all', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => generateQuestion()}
              >
                <IconRetry />
                <span>{s.retry}</span>
              </div>
            </>
          )}
        </div>
        {!questionLoading && (
          <div className="mobile-answer-btns">
            <button
              className={`mobile-answer-btn yes-btn${hoverSide === 'yes' ? ' active' : ''}`}
              onClick={() => handleAnswer('yes')}
              disabled={buttonsDisabled}
            >
              {s.yes}
            </button>
            <button
              className={`mobile-answer-btn no-btn${hoverSide === 'no' ? ' active' : ''}`}
              onClick={() => handleAnswer('no')}
              disabled={buttonsDisabled}
            >
              {s.no}
            </button>
          </div>
        )}

        {showHint && (
          <p style={{
            marginTop: '32px',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '11px',
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'rgba(152,134,112,0.52)',
            fontStyle: 'italic',
            animation: 'fadeIn 0.8s ease both, fadeOut 0.8s 3.5s ease forwards',
            pointerEvents: 'none',
          }}>
            tap to answer
          </p>
        )}
      </div>

      {showResult && (
        <div className={`result${resultActive ? ' active' : ''} ${answerType}-result`}>
          <div className="result-accent-bar" />

          {answerType === 'yes' ? (
            <><div className="glow-ring r1" /><div className="glow-ring r2" /><div className="glow-ring r3" /></>
          ) : (
            <div className="static-line" />
          )}

          <div className="result-body" style={{ transition: 'opacity 0.5s ease' }}>
            {resultLoading ? (
              <div className="question-loading">
                <div className="dot" /><div className="dot" /><div className="dot" />
              </div>
            ) : chatMode ? (
              <span style={{
                display: 'block', opacity: 0.28, fontSize: '15px',
                fontStyle: 'italic', letterSpacing: '0.04em',
                transition: 'opacity 0.5s ease',
              }}>
                {resultLines[0]}
              </span>
            ) : (
              resultLines.map((line, i) => (
                <span
                  key={`${line}-${i}`}
                  style={{ display: 'block', opacity: 0, animation: `fadeIn 0.8s ${i * 0.45}s ease both` }}
                >
                  {line}
                </span>
              ))
            )}
          </div>

          {!resultLoading && showChatPrompt && !chatMode && (
            <div style={{ marginTop: '28px', opacity: 0, animation: 'fadeIn 0.8s 0.2s ease both' }}>
              <button
                onClick={() => setChatMode(true)}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(200,170,140,0.72)', fontSize: '14px',
                  fontStyle: 'italic', letterSpacing: '0.08em',
                  cursor: 'pointer', padding: '0',
                  borderBottom: '1px solid rgba(200,170,140,0.18)',
                  transition: 'color 0.3s, border-color 0.3s',
                }}
                onMouseEnter={e => {
                  (e.target as HTMLButtonElement).style.color = 'rgba(220,190,160,0.75)'
                  ;(e.target as HTMLButtonElement).style.borderColor = 'rgba(220,190,160,0.3)'
                }}
                onMouseLeave={e => {
                  (e.target as HTMLButtonElement).style.color = 'rgba(200,170,140,0.5)'
                  ;(e.target as HTMLButtonElement).style.borderColor = 'rgba(200,170,140,0.18)'
                }}
              >
                {s.chatPrompt}
              </button>
            </div>
          )}

          {!resultLoading && chatMode && (
            <div style={{
              marginTop: '20px', width: '100%',
              maxWidth: 'min(460px, 88vw)',
              opacity: 0, animation: 'fadeIn 0.6s ease both',
            }}>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', marginBottom: '24px' }} />

              <div style={{
                maxHeight: '300px', overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: '20px',
                paddingRight: '4px', marginBottom: '20px',
                scrollbarWidth: 'none',
              }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    opacity: 0, animation: `fadeIn 0.5s ${i * 0.08}s ease both`,
                  }}>
                    <span style={{
                      fontSize: '14px', lineHeight: 1.9, maxWidth: '88%',
                      color: msg.role === 'aya' ? 'rgba(210,188,165,0.82)' : 'rgba(195,178,160,0.6)',
                      fontStyle: msg.role === 'aya' ? 'italic' : 'normal',
                      letterSpacing: msg.role === 'aya' ? '0.03em' : '0.01em',
                      textAlign: msg.role === 'user' ? 'right' : 'left',
                    }}>
                      {msg.text}
                    </span>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: 'flex', gap: '6px', paddingLeft: '2px' }}>
                    {[0,1,2].map(i => (
                      <div key={i} className="dot" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(200,170,140,0.10)',
                borderRadius: '6px',
                padding: '10px 12px',
                paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
              }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  placeholder={s.chatPlaceholder}
                  autoFocus
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: 'rgba(220,200,178,0.85)', fontSize: '14px',
                    fontStyle: 'italic', letterSpacing: '0.03em',
                    caretColor: 'rgba(220,190,150,0.5)',
                  }}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  style={{
                    background: 'none', border: 'none',
                    cursor: chatInput.trim() ? 'pointer' : 'default',
                    padding: '0',
                    opacity: chatInput.trim() && !chatLoading ? 1 : 0.28,
                    transition: 'opacity 0.2s ease',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <IconSend active={!!chatInput.trim()} />
                </button>
              </div>

              <button
                onClick={() => setChatMode(false)}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(150,133,115,0.65)', fontSize: '12px',
                  letterSpacing: '0.1em', cursor: 'pointer',
                  marginTop: '16px', fontStyle: 'italic', padding: '0',
                }}
              >
                {s.chatClose}
              </button>
            </div>
          )}

          <button className="back-btn" onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconBack />
            <span>{s.back}</span>
          </button>

          {!resultLoading && journalData.journal && showJournal && (
            <button
              onClick={() => setShowJournalPanel(true)}
              style={{
                position: 'fixed', bottom: '22px', right: '24px',
                background: 'none', border: 'none',
                color: 'rgba(178,152,118,0.75)', fontSize: '11px',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                fontStyle: 'italic', cursor: 'pointer',
                opacity: 0, animation: 'fadeIn 0.8s 1s ease both',
                transition: 'color 0.3s, border-color 0.3s',
                padding: '0 0 2px 0',
                borderBottom: '1px solid rgba(178,152,118,0.22)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'rgba(210,182,148,0.82)'
                e.currentTarget.style.borderBottomColor = 'rgba(210,182,148,0.42)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(178,152,118,0.55)'
                e.currentTarget.style.borderBottomColor = 'rgba(178,152,118,0.22)'
              }}
            >
              {s.thisWeek}
            </button>
          )}
        </div>
      )}

      {showJournalPanel && journalData.journal && (
        <div
          className="journal-panel"
          onClick={() => setShowJournalPanel(false)}
        >
          <div
            className="journal-panel-inner"
            onClick={e => e.stopPropagation()}
          >
            <p className="journal-panel-label">{s.thisWeek}</p>
            {journalData.journal.content.split('\n').map((line, i) => (
              <span key={i} style={{
                display: 'block', fontSize: '16px',
                color: 'rgba(215,195,170,0.78)', fontStyle: 'italic',
                lineHeight: 2, opacity: 0,
                animation: `fadeIn 0.7s ${0.1 + i * 0.25}s ease both`,
              }}>
                {line}
              </span>
            ))}
            <button
              onClick={() => setShowJournalPanel(false)}
              style={{
                marginTop: '28px', background: 'none', border: 'none',
                color: 'rgba(150,133,115,0.4)', fontSize: '11px',
                letterSpacing: '0.15em', fontStyle: 'italic',
                cursor: 'pointer', padding: '0',
              }}
            >
              {s.chatClose}
            </button>
          </div>
        </div>
      )}

      <div className={`status-dot${agentStatus !== 'idle' ? ` ${agentStatus}` : ''}`}>
        <div className="dot-live" />
        <span>aya here</span>
      </div>

      {/* user info — top left */}
      <div className="user-info">
        <span className="user-name">{displayName}</span>
        <span className="info-sep">·</span>
        {isGuest ? (
          <a className="ghost-btn" href="/">sign in</a>
        ) : (
          <button className="ghost-btn" onClick={() => signOut({ callbackUrl: '/' })}>
            sign out
          </button>
        )}
      </div>

      {journalData.streak >= 2 && (
        <div className="streak-display">
          {journalData.streak} {s.streak}
        </div>
      )}

      {!showResult && (
        <button className="lang-switch" onClick={switchLang}>
          {s.switchTo}
        </button>
      )}

      <a className="nosana-badge" href="https://nosana.com" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" strokeWidth="1" />
          <path d="M12 3v18M3 12h18" strokeWidth="1" />
        </svg>
        <span>nosana</span>
      </a>
    </>
  )
}
