import { type Plugin } from "@elizaos/core";
import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

const scanWalletAction = {
  name: "SCAN_WALLET",
  description: "Scan a Solana wallet for active token delegates and assess risk.",
  similes: ["CHECK_WALLET", "ANALYZE_WALLET", "AUDIT_WALLET", "SCAN_APPROVALS"],
  validate: async (_runtime: any, message: any) => {
    const text = message.content.text?.toLowerCase() || "";
    return (
      text.includes("scan") ||
      text.includes("check") ||
      text.includes("wallet") ||
      text.includes("safe") ||
      text.includes("approval")
    );
  },
  handler: async (_runtime: any, message: any, _state: any, _options: any, callback: any) => {
    const text = message.content.text || "";
    const addressMatch = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);

    if (!addressMatch) {
      if (callback) {
        await callback({
          text: "Please provide your Solana wallet address. Example: 'Scan 7xKXtg2CW87d97TXJSDpbD5jBkheTqA5ypSrZq4dNAX'",
        });
      }
      return true;
    }

    const walletAddress = addressMatch[0];

    try {
      const connection = new Connection(RPC_URL, "confirmed");
      const pubkey = new PublicKey(walletAddress);

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      });

      const delegates: any[] = [];

      for (const account of tokenAccounts.value) {
        const info = account.account.data.parsed?.info;
        if (info?.delegate) {
          delegates.push({
            mint: info.mint,
            delegate: info.delegate,
            amount: info.delegatedAmount?.uiAmount || 0,
          });
        }
      }

      if (delegates.length === 0) {
        if (callback) {
          await callback({
            text: `✅ Wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} is clean. No active token delegates found.`,
          });
        }
        return true;
      }

      let report = `🔍 Scan complete for ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\n\n`;
      report += `Found ${delegates.length} active delegate(s):\n\n`;

      delegates.forEach((d, i) => {
        const isUnlimited = d.amount > 1000000;
        const risk = isUnlimited ? "🔴 DANGEROUS" : "🟡 WARNING";
        report += `${i + 1}. ${risk}\n`;
        report += `   Token: ${d.mint.slice(0, 8)}...\n`;
        report += `   Delegate: ${d.delegate.slice(0, 8)}...\n`;
        report += `   Amount: ${isUnlimited ? "Unlimited" : d.amount}\n\n`;
      });

      report += `Reply with "revoke all" to remove all delegates.`;

      if (callback) await callback({ text: report });
    } catch (error) {
      if (callback) {
        await callback({
          text: `Scan failed: ${error instanceof Error ? error.message : "Unknown error"}. Check the address and try again.`,
        });
      }
    }

    return true;
  },
  examples: [],
};

export const sentinelPlugin: Plugin = {
  name: "sentinel-plugin",
  description: "Solana wallet security scanner — detects and helps revoke dangerous token delegates",
  actions: [scanWalletAction],
  providers: [],
  evaluators: [],
};

export default sentinelPlugin;
