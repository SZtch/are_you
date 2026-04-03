import { Connection, PublicKey } from "@solana/web3.js";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

const RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

export type RiskLevel = "safe" | "medium" | "high";

export type ScanFinding = {
  token: string;
  delegate: string;
  amount: string;
  risk: "high" | "medium";
  reason: string;
};

export type ScanSummary = {
  wallet: string;
  totalFindings: number;
  highRiskCount: number;
  mediumRiskCount: number;
  riskLevel: RiskLevel;
  recommendedAction: string;
  topRisk: ScanFinding | null;
  findings: ScanFinding[];
};

export function isValidSolanaAddress(address: string): boolean {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey.toBytes());
  } catch {
    return false;
  }
}

function toRiskReason(amount: number): { risk: "high" | "medium"; reason: string } {
  if (amount > 1000000) {
    return {
      risk: "high",
      reason: "Large active delegate amount detected. Review and revoke first.",
    };
  }

  return {
    risk: "medium",
    reason: "Active delegate found. Review whether this approval is still needed.",
  };
}

function buildSummary(wallet: string, findings: ScanFinding[]): ScanSummary {
  const highRiskCount = findings.filter((item) => item.risk === "high").length;
  const mediumRiskCount = findings.filter((item) => item.risk === "medium").length;

  const sorted = [...findings].sort((a, b) => {
    if (a.risk === b.risk) return 0;
    return a.risk === "high" ? -1 : 1;
  });

  const topRisk = sorted[0] ?? null;

  let riskLevel: RiskLevel = "safe";
  let recommendedAction = "No immediate action is required. Run another scan after interacting with new protocols.";

  if (highRiskCount > 0) {
    riskLevel = "high";
    recommendedAction = "Revoke the highest-risk delegate first.";
  } else if (mediumRiskCount > 0) {
    riskLevel = "medium";
    recommendedAction = "Review active delegates and revoke unnecessary ones.";
  }

  return {
    wallet,
    totalFindings: findings.length,
    highRiskCount,
    mediumRiskCount,
    riskLevel,
    recommendedAction,
    topRisk,
    findings,
  };
}

export async function scanWallet(address: string): Promise<ScanSummary> {
  if (!isValidSolanaAddress(address)) {
    throw new Error("Invalid Solana wallet address");
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const owner = new PublicKey(address);

  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });

  const findings: ScanFinding[] = [];

  for (const account of tokenAccounts.value) {
    const info: any = account.account.data.parsed?.info;

    if (info?.delegate) {
      const delegatedAmount =
        info.delegatedAmount?.amount?.toString?.() ??
        info.delegatedAmount?.uiAmount?.toString?.() ??
        "unknown";

      const numericAmount =
        delegatedAmount !== "unknown" ? Number(delegatedAmount) : 0;

      const { risk, reason } = toRiskReason(numericAmount);

      findings.push({
        token: info.mint,
        delegate: info.delegate,
        amount: delegatedAmount,
        risk,
        reason,
      });
    }
  }

  return buildSummary(address, findings);
}
