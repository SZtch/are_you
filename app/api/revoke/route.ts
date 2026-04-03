import { NextRequest, NextResponse } from "next/server";
import { prepareRevoke } from "@/services/blockchain/revoke";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const wallet = body?.wallet?.trim();
    const token = body?.token?.trim();
    const delegate = body?.delegate?.trim();
    const amount = body?.amount?.toString?.() ?? "";
    const risk = body?.risk;

    if (!wallet || !token || !delegate || !risk) {
      return NextResponse.json(
        { error: "wallet, token, delegate, and risk are required" },
        { status: 400 }
      );
    }

    const result = prepareRevoke({
      wallet,
      token,
      delegate,
      amount,
      risk,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Revoke preparation failed",
      },
      { status: 500 }
    );
  }
}
