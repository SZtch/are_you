import { NextRequest, NextResponse } from "next/server";
import { scanWallet } from "@/services/blockchain/solana";
import { explainScan } from "@/services/agent/eliza";

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

    const scan = await scanWallet(address);
    const explain = await explainScan(scan);

    return NextResponse.json({
      ...scan,
      explain,
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
