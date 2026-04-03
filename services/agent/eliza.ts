type Finding = {
  token: string;
  delegate: string;
  amount: string;
  risk: "high" | "medium";
  reason: string;
};

export type ScanExplainInput = {
  wallet: string;
  totalFindings: number;
  highRiskCount: number;
  mediumRiskCount: number;
  riskLevel: "safe" | "medium" | "high";
  recommendedAction: string;
  topRisk: Finding | null;
  findings: Finding[];
};

export type ExplainResult = {
  summary: string;
  explanation: string;
  nextStep: string;
};

const OPENAI_API_URL = process.env.OPENAI_API_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL_NAME = process.env.MODEL_NAME || "Qwen3.5-27B-AWQ-4bit";

function fallbackExplain(input: ScanExplainInput): ExplainResult {
  if (input.riskLevel === "safe") {
    return {
      summary: "Your wallet is currently safe.",
      explanation:
        "No active token delegates were found in this scan. That means there are no detected third-party permissions that can currently move your tokens through an active delegate.",
      nextStep: "No immediate action is required. Run another scan after interacting with new protocols.",
    };
  }

  if (input.topRisk) {
    return {
      summary: `Your wallet has ${input.riskLevel} risk findings.`,
      explanation: `The most important issue is an active delegate on token ${input.topRisk.token}. ${input.topRisk.reason}`,
      nextStep: input.recommendedAction,
    };
  }

  return {
    summary: "Scan completed.",
    explanation: "Some findings were detected and should be reviewed.",
    nextStep: input.recommendedAction,
  };
}

export async function explainScan(input: ScanExplainInput): Promise<ExplainResult> {
  if (!OPENAI_API_URL || !OPENAI_API_KEY) {
    return fallbackExplain(input);
  }

  const prompt = `
You are Sentinel, a concise Solana wallet security assistant.

Rules:
- Do not invent blockchain facts.
- Use only the provided scan data.
- Be concise and clear.
- Return strict JSON with keys: summary, explanation, nextStep.
- explanation should be 2-4 sentences max.

Scan data:
${JSON.stringify(input, null, 2)}
`;

  try {
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are Sentinel, a direct and reliable Solana wallet security assistant.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      return fallbackExplain(input);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return fallbackExplain(input);
    }

    const parsed = JSON.parse(content);

    return {
      summary: parsed.summary || fallbackExplain(input).summary,
      explanation: parsed.explanation || fallbackExplain(input).explanation,
      nextStep: parsed.nextStep || fallbackExplain(input).nextStep,
    };
  } catch {
    return fallbackExplain(input);
  }
}
