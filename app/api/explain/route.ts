import { NextRequest, NextResponse } from "next/server";
import { explainScan } from "@/services/agent/eliza";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await explainScan(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Explain failed",
      },
      { status: 500 }
    );
  }
}
