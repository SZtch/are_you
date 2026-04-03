import { Connection, PublicKey } from "@solana/web3.js";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

const RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

export type ScanFinding = {
  token: string;
  delegate: string;
  amount: string;
  risk: "high" | "medium";
};

export function isValidSolanaAddress(address: string): boolean {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey.toBytes());
  } catch {
    return false;
  }
}

export async function scanWallet(address: string): Promise<ScanFinding[]> {
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

      findings.push({
        token: info.mint,
        delegate: info.delegate,
        amount: delegatedAmount,
        risk: numericAmount > 1000000 ? "high" : "medium",
      });
    }
  }

  return findings;
}
