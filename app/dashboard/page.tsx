"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";

type Finding = {
  token: string;
  delegate: string;
  amount: string;
  risk: "high" | "medium";
  reason: string;
};

type ScanResult = {
  wallet: string;
  totalFindings: number;
  highRiskCount: number;
  mediumRiskCount: number;
  riskLevel: "safe" | "medium" | "high";
  recommendedAction: string;
  topRisk: Finding | null;
  findings: Finding[];
  explain: {
    summary: string;
    explanation: string;
    nextStep: string;
  };
};

type RevokeResult = {
  status: string;
  title: string;
  description: string;
  instructions: string[];
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 9, color: "#0f2535", letterSpacing: "0.12em", marginBottom: 6 }}>{children}</p>
);

const Card = ({ children, danger }: { children: React.ReactNode; danger?: boolean }) => (
  <div style={{
    padding: "16px 18px",
    background: danger ? "rgba(255,40,40,0.04)" : "rgba(10,26,40,0.5)",
    border: `1px solid ${danger ? "rgba(255,40,40,0.2)" : "#0a1a28"}`,
    borderRadius: 6,
    marginBottom: 10,
  }}>
    {children}
  </div>
);

export default function DashboardPage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeResult, setRevokeResult] = useState<RevokeResult | null>(null);
  const [revokeError, setRevokeError] = useState("");

  async function handleScan() {
    if (!address.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    setRevokeResult(null);
    setRevokeError("");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        body: JSON.stringify({ address: address.trim() }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Scan failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(item: Finding) {
    if (!result) return;
    setRevokeLoading(true);
    setRevokeError("");
    setRevokeResult(null);

    try {
      const res = await fetch("/api/revoke", {
        method: "POST",
        body: JSON.stringify({ wallet: result.wallet, token: item.token, delegate: item.delegate, amount: item.amount, risk: item.risk }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Revoke failed");
      setRevokeResult(data);
    } catch (err) {
      setRevokeError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRevokeLoading(false);
    }
  }

  const riskColor = {
    safe: "#00cc88",
    medium: "#ffaa00",
    high: "#ff4444",
  };

  return (
    <AppShell>
      <style>{`
        .addr-input {
          background: transparent; border: none; outline: none;
          color: #c8e0f0; font-family: 'DM Mono', monospace;
          font-size: 12px; width: 100%; letter-spacing: 0.05em;
        }
        .addr-input::placeholder { color: #1a3040; }
        .scan-btn {
          background: linear-gradient(135deg, #00e5ff, #0088aa);
          border: none; color: #03070d;
          font-family: 'DM Mono', monospace; font-size: 11px;
          font-weight: 500; letter-spacing: 0.15em;
          padding: 12px 28px; cursor: pointer;
          clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
          transition: all 0.2s; white-space: nowrap;
        }
        .scan-btn:hover { background: linear-gradient(135deg, #00ffff, #00aacc); }
        .scan-btn:disabled { background: #0f2030; color: #1a3040; cursor: not-allowed; }
        .revoke-btn {
          background: rgba(255,40,40,0.1); border: 1px solid rgba(255,40,40,0.3);
          color: #ff6666; font-family: 'DM Mono', monospace; font-size: 10px;
          letter-spacing: 0.1em; padding: 8px 18px; cursor: pointer;
          border-radius: 4px; transition: all 0.2s; margin-top: 12px;
        }
        .revoke-btn:hover { background: rgba(255,40,40,0.2); }
        .revoke-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease; }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* Scan bar */}
        <div style={{ marginBottom: 24 }}>
          <Label>// TARGET WALLET</Label>
          <div style={{
            display: "flex", gap: 0,
            background: "rgba(10,26,40,0.6)",
            border: "1px solid #0f2535", borderRadius: 4, overflow: "hidden",
          }}>
            <div style={{ flex: 1, padding: "13px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: "#0f2535" }}>❯</span>
              <input
                className="addr-input"
                placeholder="Paste Solana wallet address..."
                value={address}
                onChange={e => setAddress(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleScan()}
              />
            </div>
            <button className="scan-btn" onClick={handleScan} disabled={loading || !address.trim()}>
              {loading ? "SCANNING" : "SCAN →"}
            </button>
          </div>
          {error && <p style={{ fontSize: 11, color: "#ff4444", marginTop: 8, letterSpacing: "0.05em" }}>{error}</p>}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "60px 0" }}>
            <div style={{ width: 32, height: 32, border: "2px solid #0a1a28", borderTopColor: "#00e5ff", borderRadius: "50%" }} className="spin" />
            <span style={{ fontSize: 11, color: "#0f2535", letterSpacing: "0.12em" }}>SCANNING BLOCKCHAIN...</span>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div style={{ textAlign: "center", padding: "80px 0", opacity: 0.4 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", color: "#0f2535" }}>AWAITING WALLET ADDRESS</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="fade-up">

            {/* Status header */}
            <div style={{
              padding: "14px 18px", marginBottom: 16,
              background: "rgba(10,26,40,0.5)", border: "1px solid #0a1a28", borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <Label>SCANNED WALLET</Label>
                <p style={{ fontSize: 11, color: "#4a7090", wordBreak: "break-all" }}>{result.wallet}</p>
              </div>
              <div style={{
                fontSize: 10, padding: "6px 18px", letterSpacing: "0.1em", fontWeight: 500,
                clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
                background: result.riskLevel === "safe" ? "rgba(0,204,136,0.1)" : result.riskLevel === "high" ? "rgba(255,40,40,0.1)" : "rgba(255,170,0,0.1)",
                color: riskColor[result.riskLevel],
                border: `1px solid ${result.riskLevel === "safe" ? "rgba(0,204,136,0.25)" : result.riskLevel === "high" ? "rgba(255,40,40,0.25)" : "rgba(255,170,0,0.25)"}`,
              }}>
                {result.riskLevel === "safe" ? "◉ CLEAN" : result.riskLevel === "high" ? `⚠ ${result.highRiskCount} CRITICAL` : `⚠ ${result.mediumRiskCount} WARNING`}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "TOTAL DELEGATES", value: result.totalFindings },
                { label: "HIGH RISK", value: result.highRiskCount, color: result.highRiskCount > 0 ? "#ff4444" : undefined },
                { label: "MEDIUM RISK", value: result.mediumRiskCount, color: result.mediumRiskCount > 0 ? "#ffaa00" : undefined },
              ].map((s, i) => (
                <div key={i} style={{ padding: "12px 16px", background: "rgba(10,26,40,0.4)", border: "1px solid #0a1a28", borderRadius: 6 }}>
                  <Label>{s.label}</Label>
                  <p style={{ fontSize: 22, fontFamily: "Orbitron, monospace", fontWeight: 700, color: s.color || "#2a5070" }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* AI Explanation */}
            <Card>
              <Label>// SENTINEL ANALYSIS</Label>
              <p style={{ fontSize: 12, color: "#6a9ab0", lineHeight: 1.7, marginBottom: 10 }}>{result.explain.summary}</p>
              <p style={{ fontSize: 11, color: "#4a7090", lineHeight: 1.7, marginBottom: 10 }}>{result.explain.explanation}</p>
              <div style={{ borderTop: "1px solid #0a1a28", paddingTop: 10, marginTop: 10 }}>
                <Label>RECOMMENDED ACTION</Label>
                <p style={{ fontSize: 11, color: "#4a8070" }}>{result.explain.nextStep}</p>
              </div>
            </Card>

            {/* Clean state */}
            {result.riskLevel === "safe" && (
              <div style={{ textAlign: "center", padding: "32px", background: "rgba(0,204,136,0.04)", border: "1px solid rgba(0,204,136,0.12)", borderRadius: 6 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <p style={{ fontSize: 12, color: "#00cc88", marginBottom: 6 }}>No active token delegates found</p>
                <p style={{ fontSize: 10, color: "#0f2535" }}>Scan regularly to stay protected</p>
              </div>
            )}

            {/* Findings */}
            {result.findings.map((f, i) => (
              <Card key={i} danger={f.risk === "high"}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 9, color: f.risk === "high" ? "#ff4444" : "#ffaa00", letterSpacing: "0.12em" }}>
                    {f.risk === "high" ? "// CRITICAL THREAT" : "// WARNING"}
                  </span>
                  <span style={{ fontSize: 9, color: "#0f2535" }}>DELEGATE #{i + 1}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 10 }}>
                  {[
                    { label: "TOKEN MINT", value: f.token },
                    { label: "DELEGATE", value: f.delegate },
                    { label: "ALLOWANCE", value: Number(f.amount) > 1000000 ? "UNLIMITED ⚠️" : f.amount },
                  ].map((item, j) => (
                    <div key={j}>
                      <Label>{item.label}</Label>
                      <p style={{ fontSize: 10, color: f.risk === "high" ? "#ff6666" : "#ffcc44", wordBreak: "break-all", lineHeight: 1.5 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: "#4a6070", marginBottom: 4 }}>{f.reason}</p>
                <button className="revoke-btn" onClick={() => handleRevoke(f)} disabled={revokeLoading}>
                  {revokeLoading ? "PREPARING..." : "PREPARE REVOKE →"}
                </button>
              </Card>
            ))}

            {/* Revoke result */}
            {revokeError && <p style={{ fontSize: 11, color: "#ff4444", marginTop: 8 }}>{revokeError}</p>}
            {revokeResult && (
              <Card>
                <Label>// REVOKE PLAN</Label>
                <p style={{ fontSize: 12, color: "#6a9ab0", marginBottom: 10 }}>{revokeResult.title}</p>
                <p style={{ fontSize: 11, color: "#4a7090", lineHeight: 1.7, marginBottom: 12 }}>{revokeResult.description}</p>
                <Label>INSTRUCTIONS</Label>
                <ol style={{ paddingLeft: 20, margin: 0 }}>
                  {revokeResult.instructions.map((step, i) => (
                    <li key={i} style={{ fontSize: 11, color: "#4a7090", lineHeight: 1.8, marginBottom: 4 }}>{step}</li>
                  ))}
                </ol>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
