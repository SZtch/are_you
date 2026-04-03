"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";

export default function DashboardPage() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<any>(null);

  async function handleScan() {
    const res = await fetch("/api/scan", {
      method: "POST",
      body: JSON.stringify({ address }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    setResult(data);
  }

  return (
    <AppShell>
      <div className="grid gap-6">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Solana wallet"
          className="border p-2"
        />

        <button onClick={handleScan} className="bg-white text-black p-2">
          Scan
        </button>

        {result && (
          <pre className="text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </AppShell>
  );
}
