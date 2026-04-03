export type RevokeRequest = {
  wallet: string;
  token: string;
  delegate: string;
  amount: string;
  risk: "high" | "medium";
};

export type RevokeResponse = {
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

export function prepareRevoke(input: RevokeRequest): RevokeResponse {
  return {
    status: "ready",
    action: "revoke_delegate",
    title: "Revoke delegate action prepared",
    description:
      "This wallet has an active delegate that should be reviewed. The next step is to revoke the delegate from the relevant token account or wallet flow.",
    wallet: input.wallet,
    token: input.token,
    delegate: input.delegate,
    risk: input.risk,
    instructions: [
      "Open your Solana wallet or token management tool.",
      "Locate the token account with the active delegate.",
      "Revoke the delegate approval for the flagged token.",
      "Run Sentinel again to confirm the delegate is gone."
    ],
  };
}
