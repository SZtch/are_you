'use client'

import { signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'

type Lang = 'id' | 'en'

const CONTENT = {
  en: {
    eyebrow: 'oneQ',
    title1: 'are you',
    title2: 'happy?',
    subtitle: 'one question. one feeling. every day.',
    btn: 'continue with google',
    btnGuest: 'continue as guest',
    btnLoading: 'signing in...',
    btnGuestLoading: 'entering...',
    footer: 'built on nosana · powered by elizaos',
    switchTo: 'id',
  },
  id: {
    eyebrow: 'oneQ',
    title1: 'apakah kamu',
    title2: 'bahagia?',
    subtitle: 'satu pertanyaan. satu perasaan. setiap hari.',
    btn: 'masuk dengan google',
    btnGuest: 'lanjut sebagai tamu',
    btnLoading: 'masuk...',
    btnGuestLoading: 'masuk...',
    footer: 'dibangun di nosana · didukung elizaos',
    switchTo: 'en',
  },
}

export default function Landing() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingGuest, setLoadingGuest] = useState(false)
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    const l = navigator.language || ''
    if (l.startsWith('id')) setLang('id')
    return () => clearTimeout(t)
  }, [])

  const handleSignIn = async () => {
    setLoading(true)
    try {
      await signIn('google', { callbackUrl: '/app' })
    } catch {
      setLoading(false)
    }
  }

  const handleGuest = async () => {
    setLoadingGuest(true)
    try {
      await fetch('/api/auth/guest', { method: 'POST' })
      window.location.href = '/app'
    } catch {
      setLoadingGuest(false)
    }
  }

  const c = CONTENT[lang]
  const anyLoading = loading || loadingGuest

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0c0a09;
          min-height: 100vh;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        .landing {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          position: relative;
          overflow: hidden;
        }

        .landing::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 50% 0%, rgba(160, 100, 50, 0.07) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 20% 80%, rgba(80, 60, 120, 0.05) 0%, transparent 60%),
            radial-gradient(ellipse 30% 30% at 80% 60%, rgba(100, 140, 160, 0.04) 0%, transparent 60%);
          pointer-events: none;
        }

        .landing::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.2;
        }

        .content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 520px;
          width: 100%;
        }

        .eyebrow {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 13px;
          letter-spacing: 0.22em;
          color: rgba(182, 144, 94, 0.78);
          text-transform: uppercase;
          margin-bottom: 32px;
          opacity: 0;
          transition: opacity 1.2s ease;
        }

        .eyebrow.visible { opacity: 1; }

        .title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(52px, 10vw, 88px);
          font-weight: 300;
          color: rgba(220, 200, 175, 0.92);
          line-height: 1.05;
          letter-spacing: -0.01em;
          margin-bottom: 16px;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 1.2s ease 0.2s, transform 1.2s ease 0.2s;
        }

        .title.visible { opacity: 1; transform: translateY(0); }

        .subtitle {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 16px;
          font-style: italic;
          color: rgba(182, 158, 124, 0.82);
          margin-bottom: 56px;
          opacity: 0;
          transition: opacity 1.2s ease 0.5s;
        }

        .subtitle.visible { opacity: 1; }

        .btn-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        @keyframes borderPulse {
          0%, 100% { border-color: rgba(200, 170, 120, 0.18); }
          50%       { border-color: rgba(200, 170, 120, 0.38); }
        }

        .signin-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 13px 28px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(200, 170, 120, 0.18);
          border-radius: 6px;
          color: rgba(212, 188, 154, 0.9);
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 14px;
          letter-spacing: 0.08em;
          cursor: pointer;
          opacity: 0;
          transition: opacity 1.2s ease 0.8s, background 0.3s, border-color 0.3s, color 0.3s;
        }

        .signin-btn.visible {
          opacity: 1;
          animation: borderPulse 4s 2.2s ease-in-out infinite;
        }

        .signin-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(200, 170, 120, 0.5) !important;
          color: rgba(230, 210, 180, 0.95);
          animation-play-state: paused;
        }

        .signin-btn:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .signin-btn:focus-visible {
          outline: 1px solid rgba(200,170,120,0.35);
          outline-offset: 4px;
        }

        .guest-btn {
          font-size: 13px;
          letter-spacing: 0.06em;
          color: rgba(180, 160, 130, 0.65);
          border-color: rgba(180, 160, 130, 0.1);
          transition: opacity 1.2s ease 1s, background 0.3s, border-color 0.3s, color 0.3s;
          animation: none !important;
        }

        .guest-btn.visible { opacity: 1; }

        .guest-btn:hover:not(:disabled) {
          color: rgba(200, 178, 148, 0.85);
          border-color: rgba(200, 170, 120, 0.3) !important;
          animation: none !important;
        }

        .footer {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 12px;
          letter-spacing: 0.14em;
          color: rgba(152, 124, 95, 0.62);
          white-space: nowrap;
          opacity: 0;
          transition: opacity 1.2s ease 1.2s;
        }

        .footer.visible { opacity: 1; }

        .lang-toggle {
          position: fixed;
          top: 18px;
          right: 20px;
          z-index: 50;
          background: none;
          border: 1px solid rgba(200,170,130,0.15);
          border-radius: 4px;
          cursor: pointer;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 0.72rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(185,160,126,0.72);
          padding: 5px 10px;
          opacity: 0;
          transition: opacity 1.2s ease 1.5s, color 0.3s ease, border-color 0.3s ease;
        }
        .lang-toggle.visible { opacity: 1; }
        .lang-toggle:hover { color: rgba(222,192,158,0.98); border-color: rgba(202,172,132,0.45); }

        @media (max-width: 768px) {
          .landing {
            justify-content: center;
            min-height: 100dvh;
            padding-bottom: 12vh;
          }

          .title {
            font-size: clamp(44px, 14vw, 72px);
          }

          .subtitle {
            margin-bottom: 40px;
          }

          .footer {
            bottom: 16px;
            font-size: 11px;
          }
        }
      `}</style>

      <button
        className={`lang-toggle${visible ? ' visible' : ''}`}
        onClick={() => setLang(l => l === 'en' ? 'id' : 'en')}
      >
        {c.switchTo}
      </button>

      <div className="landing">
        <div className="content">
          <p className={`eyebrow${visible ? ' visible' : ''}`}>{c.eyebrow}</p>
          <h1 className={`title${visible ? ' visible' : ''}`}>
            {c.title1}<br />{c.title2}
          </h1>
          <p className={`subtitle${visible ? ' visible' : ''}`}>
            {c.subtitle}
          </p>

          <div className="btn-group">
            <button
              className={`signin-btn${visible ? ' visible' : ''}`}
              onClick={handleSignIn}
              disabled={anyLoading}
            >
              {loading ? c.btnLoading : c.btn}
            </button>

            <button
              className={`signin-btn guest-btn${visible ? ' visible' : ''}`}
              onClick={handleGuest}
              disabled={anyLoading}
            >
              {loadingGuest ? c.btnGuestLoading : c.btnGuest}
            </button>
          </div>
        </div>

        <p className={`footer${visible ? ' visible' : ''}`}>
          {c.footer}
        </p>
      </div>
    </>
  )
}
