import { NextRequest, NextResponse } from "next/server";
import { scanWallet } from "@/services/blockchain/solana";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const address = body?.address?.trim();

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const findings = await scanWallet(address);

    return NextResponse.json({
      wallet: address,
      totalFindings: findings.length,
      findings,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Scan failed",
      },
      { status: 500 }
    );
  }
}
