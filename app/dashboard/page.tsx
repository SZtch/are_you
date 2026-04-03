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

type ExplainResult = {
  summary: string;
  explanation: string;
  nextStep: string;
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
  explain: ExplainResult;
};

type RevokeResult = {
  status: "ready";
  action: "revoke_delegate";
  title: string;
  description: string;
  wallet: string;
  token: string;
  delegate: string;
  risk: "high" | "medium";
  instructions: string[];
};

export default function DashboardPage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeError, setRevokeError] = useState("");
  const [revokeResult, setRevokeResult] = useState<RevokeResult | null>(null);

  async function handleScan() {
    try {
      setLoading(true);
      setError("");
      setResult(null);
      setRevokeError("");
      setRevokeResult(null);

      const res = await fetch("/api/scan", {
        method: "POST",
        body: JSON.stringify({ address }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Scan failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handlePrepareRevoke(item: Finding) {
    if (!result) return;

    try {
      setRevokeLoading(true);
      setRevokeError("");
      setRevokeResult(null);

      const res = await fetch("/api/revoke", {
        method: "POST",
        body: JSON.stringify({
          wallet: result.wallet,
          token: item.token,
          delegate: item.delegate,
          amount: item.amount,
          risk: item.risk,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Revoke preparation failed");
      }

      setRevokeResult(data);
    } catch (err) {
      setRevokeError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRevokeLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="grid gap-6">
        <section className="rounded-2xl border border-white/10 p-6">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <p className="mt-2 text-sm text-white/65">
            Paste a Solana wallet address and scan active token delegates.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter Solana wallet address"
              className="rounded-lg border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
            />

            <button
              onClick={handleScan}
              disabled={loading || !address.trim()}
              className="rounded-lg bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-50"
            >
              {loading ? "Scanning..." : "Scan wallet"}
            </button>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </div>
        </section>

        {result ? (
          <>
            <section className="rounded-2xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold">Sentinel Explanation</h3>

              <div className="mt-4 rounded-xl border border-white/10 p-4">
                <p className="text-sm text-white/50">Summary</p>
                <p className="mt-2 text-sm text-white/95">{result.explain.summary}</p>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 p-4">
                <p className="text-sm text-white/50">Explanation</p>
                <p className="mt-2 text-sm text-white/90">
                  {result.explain.explanation}
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 p-4">
                <p className="text-sm text-white/50">Next Step</p>
                <p className="mt-2 text-sm text-white/90">{result.explain.nextStep}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold">Decision Summary</h3>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 p-4">
                  <p className="text-sm text-white/50">Wallet</p>
                  <p className="mt-1 break-all text-sm">{result.wallet}</p>
                </div>

                <div className="rounded-xl border border-white/10 p-4">
                  <p className="text-sm text-white/50">Risk Level</p>
                  <p
                    className={`mt-1 text-sm font-medium ${
                      result.riskLevel === "high"
                        ? "text-red-300"
                        : result.riskLevel === "medium"
                        ? "text-yellow-300"
                        : "text-emerald-300"
                    }`}
                  >
                    {result.riskLevel.toUpperCase()}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 p-4">
                  <p className="text-sm text-white/50">High Risk</p>
                  <p className="mt-1 text-sm">{result.highRiskCount}</p>
                </div>

                <div className="rounded-xl border border-white/10 p-4">
                  <p className="text-sm text-white/50">Medium Risk</p>
                  <p className="mt-1 text-sm">{result.mediumRiskCount}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 p-4">
                <p className="text-sm text-white/50">Recommended Action</p>
                <p className="mt-2 text-sm text-white/90">
                  {result.recommendedAction}
                </p>
              </div>

              {result.topRisk ? (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-sm text-white/50">Top Risk First</p>
                  <p className="mt-2 text-sm">
                    Token: <span className="break-all">{result.topRisk.token}</span>
                  </p>
                  <p className="mt-1 text-sm">
                    Delegate: <span className="break-all">{result.topRisk.delegate}</span>
                  </p>
                  <p className="mt-1 text-sm">Amount: {result.topRisk.amount}</p>
                  <p className="mt-1 text-sm text-red-300">
                    {result.topRisk.reason}
                  </p>

                  <button
                    onClick={() => handlePrepareRevoke(result.topRisk!)}
                    disabled={revokeLoading}
                    className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {revokeLoading ? "Preparing revoke..." : "Prepare revoke action"}
                  </button>
                </div>
              ) : null}
            </section>

            {revokeError ? (
              <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                <p className="text-sm text-red-300">{revokeError}</p>
              </section>
            ) : null}

            {revokeResult ? (
              <section className="rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold">Revoke Plan</h3>

                <div className="mt-4 rounded-xl border border-white/10 p-4">
                  <p className="text-sm text-white/50">Action</p>
                  <p className="mt-2 text-sm text-white/95">{revokeResult.title}</p>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 p-4">
                  <p className="text-sm text-white/50">Description</p>
                  <p className="mt-2 text-sm text-white/90">
                    {revokeResult.description}
                  </p>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 p-4">
                    <p className="text-sm text-white/50">Token</p>
                    <p className="mt-2 break-all text-sm">{revokeResult.token}</p>
                  </div>

                  <div className="rounded-xl border border-white/10 p-4">
                    <p className="text-sm text-white/50">Delegate</p>
                    <p className="mt-2 break-all text-sm">{revokeResult.delegate}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 p-4">
                  <p className="text-sm text-white/50">Instructions</p>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-white/90">
                    {revokeResult.instructions.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
