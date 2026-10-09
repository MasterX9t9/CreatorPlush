export interface GroundedRecordCitation {
  id: string;
  type: "video" | "channel" | "niche";
  metric: string;
  value: string | number;
}

export interface AIAnalysisResponse {
  answer: string;
  dataFindings: string[];
  recommendations: string[];
  citations: GroundedRecordCitation[];
  modelUsed: string;
}

export interface AIProvider {
  generateGroundedAnalysis(
    userPrompt: string,
    groundedContext: {
      channels?: Array<{ id: string; title: string; views: number; subs: number }>;
      videos?: Array<{ id: string; title: string; views: number; outlierMultiplier?: number }>;
    }
  ): Promise<AIAnalysisResponse>;
}

export class GeminiProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
  }

  async generateGroundedAnalysis(
    userPrompt: string,
    groundedContext: {
      channels?: Array<{ id: string; title: string; views: number; subs: number }>;
      videos?: Array<{ id: string; title: string; views: number; outlierMultiplier?: number }>;
    }
  ): Promise<AIAnalysisResponse> {
    if (!this.apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured. Set GEMINI_API_KEY in your environment to use the AI Creator Assistant."
      );
    }

    const systemInstructions = `
You are the CreatorPulse AI Creator Strategist.
STRICT RULE: You must ONLY cite and reference facts from the verified YouTube dataset provided below.
DO NOT invent view counts, subscriber numbers, RPM, or statistics.
If the data does not contain the answer, state honestly: "Data unavailable in the retrieved dataset."
Separate your response into:
1. DATA FINDINGS (strictly factual observations referencing the records)
2. AI RECOMMENDATIONS (strategic advice based on those findings)
`;

    const contextString = JSON.stringify(groundedContext, null, 2);
    const fullPrompt = `${systemInstructions}\n\n[VERIFIED DATASET]:\n${contextString}\n\n[CREATOR QUESTION]:\n${userPrompt}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: fullPrompt }],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`AI Provider error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const candidateText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI analysis unavailable. The provider did not return text content.";

    // Assemble citations based on actual grounded records
    const citations: GroundedRecordCitation[] = [];
    if (groundedContext.videos) {
      groundedContext.videos.slice(0, 5).forEach((v) => {
        citations.push({
          id: v.id,
          type: "video",
          metric: "views",
          value: v.views,
        });
      });
    }

    return {
      answer: candidateText,
      dataFindings: [
        `Grounded on ${groundedContext.videos?.length || 0} retrieved videos and ${groundedContext.channels?.length || 0} channels.`,
      ],
      recommendations: [],
      citations,
      modelUsed: "gemini-1.5-flash",
    };
  }
}

export const aiProvider = new GeminiProvider();
