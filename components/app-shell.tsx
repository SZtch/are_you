"use client";

import { useEffect, useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60);
    return () => clearInterval(id);
  }, []);

  const angle = (tick * 1.5) % 360;
  const gx = 50 + 40 * Math.cos((angle * Math.PI) / 180);
  const gy = 50 + 40 * Math.sin((angle * Math.PI) / 180);

  return (
    <div style={{
      fontFamily: "'DM Mono', 'Fira Code', monospace",
      background: "#03070d",
      minHeight: "100vh",
      color: "#6a8fa0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Orbitron:wght@700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #0a1a28; border-radius: 2px; }
        .grid-bg {
          background-image:
            linear-gradient(rgba(0,229,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }
        .pulse { animation: pulse 2s infinite; }
      `}</style>

      {/* Ambient glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 700px 500px at ${gx}% ${gy}%, rgba(0,229,255,0.025) 0%, transparent 70%)`,
      }} />

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid #0a1a28",
        padding: "0 28px", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(3,7,13,0.9)", backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00e5ff", boxShadow: "0 0 12px #00e5ff, 0 0 24px #00e5ff44" }} className="pulse" />
          <span style={{ fontFamily: "Orbitron, monospace", fontWeight: 900, fontSize: 14, letterSpacing: "0.2em", color: "#e0f8ff", textShadow: "0 0 20px rgba(0,229,255,0.3)" }}>
            SENTINEL
          </span>
          <span style={{ fontSize: 9, color: "#0f2535", letterSpacing: "0.1em", paddingLeft: 10, borderLeft: "1px solid #0a1a28" }}>
            SOLANA WALLET SECURITY
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00cc88", boxShadow: "0 0 8px #00cc88" }} className="pulse" />
            <span style={{ fontSize: 9, color: "#0f3028", letterSpacing: "0.1em" }}>NOSANA NETWORK</span>
          </div>
          <span style={{ fontSize: 9, color: "#0a1a25", letterSpacing: "0.06em" }}>ELIZAOS v1.7</span>
        </div>
      </header>

      {/* Content */}
      <div className="grid-bg" style={{ position: "relative", zIndex: 1, minHeight: "calc(100vh - 52px)", padding: "28px" }}>
        {children}
      </div>
    </div>
  );
}
