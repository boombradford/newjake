import { invokeLLM } from "../_core/llm";
import { Analysis, Competitor } from "../../drizzle/schema";

interface AIInsightsResult {
  overallAnalysis: string;
  strengths: { title: string; explanation: string }[];
  weaknesses: { title: string; explanation: string }[];
  opportunities: { title: string; explanation: string }[];
  recommendations: { title: string; description: string; impact: "High" | "Medium" | "Low"; action_plan: string }[];
  detectedIndustry?: string;
}

/**
 * Generate AI-powered competitive insights
 */
export async function generateAIInsights(
  analysis: Analysis,
  competitors: Competitor[]
): Promise<AIInsightsResult> {
  try {
    // Build context for the AI
    const competitorSummary = competitors.map((c, i) => {
      return `
Competitor ${i + 1}: ${c.name}
- Google Rating: ${c.googleRating || "N/A"} (${c.googleReviewCount || 0} reviews)
- SEO Score: ${c.seoScore || "N/A"}/100
- Website: ${c.url || "No website"}
- Threat Level: ${c.threatLevel || "unknown"}
- Top Keywords: ${Array.isArray(c.topKeywords) ? (c.topKeywords as string[]).slice(0, 5).join(", ") : "N/A"}
${c.employeeCount ? `- Employee Count: ${c.employeeCount}` : ""}
${c.fundingInfo ? `- Funding: ${c.fundingInfo}` : ""}
`;
    }).join("\n");

    const targetSummary = `
Target Business: ${analysis.businessName}
Location: ${analysis.businessLocation}
Industry: ${analysis.industry || "Not specified"}
Website: ${analysis.businessUrl || "No website provided"}
Google Rating: ${analysis.googleRating || "N/A"} (${analysis.googleReviewCount || 0} reviews)
SEO Score: ${analysis.seoScore || "N/A"}/100
Content Word Count: ${analysis.contentWordCount || 0}
Has Google Business: ${analysis.hasGoogleBusiness ? "Yes" : "No"}
`;

    const prompt = `You are a World-Class Digital Strategist & Growth Hacker, but your secret weapon is your deep technical mastery as a **Local SEO & AIO (Artificial Intelligence Optimization) Expert**. 
    
    You specialize in keyword strategy, local ranking factors, and technical best practices. You don't just see "high level"; you see the code, the schema, and the signals that drive visibility. You inherently tie your high-level strategic expertise with deep technical execution.

    YOUR CAPABILITIES:
    1. **Elite Strategy:** You identify leverage points that others miss.
    2. **Local SEO & AIO Mastery:** You know exactly how to rank in the Local Pack and how to be the "cited source" for AI answers (AIO).
    3. **Technical Execution:** You recommend specific schema types, folder structures, and keyword clusters.

    YOUR MISSION:
    Conduct a forensic competitive analysis for:
    ${targetSummary}

    AGAINST THESE COMPETITORS:
    ${competitorSummary || "No direct local competitors identified via Maps (analyze based on general market standards)."}

    APPROACH:
    Your goal is to point out exactly what you see, then recommend **how to scale the good things** and **fix the bad ones**.
    - **Tie Strategy to Tech:** Don't just say "Improve SEO." Say "Implement LocalBusiness Schema with 'sameAs' properties to connect social signals."
    - **Scale the Good:** If they have good reviews, tell them how to leverage them (e.g., "Embed review widgets on high-intent service pages to boost conversion").
    - **Fix the Bad:** If they lack content, give them a Keyword Clustering strategy to dominate the niche.
    - **AIO Focus:** Recommend how to structure content (Q&A format, entity-rich text) to get picked up by AI overviews.

    REQUIRED OUTPUT (JSON):
    {
      "overallAnalysis": "A ruthless, high-level executive summary. Start with the 'Unvarnished Truth'. End with the 'Billion Dollar Opportunity'.",
      "detectedIndustry": "The specific industry niche",
      "strengths": [
        { "title": "Strategic Moat 1", "explanation": "Why this is a strength and how it drives value." },
        { "title": "Strategic Moat 2", "explanation": "Why this is a strength and how it drives value." }
      ],
      "weaknesses": [
        { "title": "Critical Vulnerability 1", "explanation": "Why this is a weakness and the risk it poses." },
        { "title": "Critical Vulnerability 2", "explanation": "Why this is a weakness and the risk it poses." }
      ],
      "opportunities": [
        { "title": "Unclaimed Revenue Stream 1", "explanation": "The potential upside and why it's currently missed." },
        { "title": "Unclaimed Revenue Stream 2", "explanation": "The potential upside and why it's currently missed." }
      ],
      "recommendations": [
        {
          "title": "High-Impact Tactic (e.g., 'Deploy Programmatic SEO')",
          "description": "The deep strategic 'WHY'. Reference specific frameworks (e.g., 'Blue Ocean Strategy', 'Jobs to be Done').",
          "impact": "High",
          "action_plan": "The exact 'HOW'. Mention specific tools, workflows, or metrics to track (e.g., 'Use Schema.org markup for...', 'Launch a retargeting layer via...')."
        }
      ]
    }

    Make your feedback feel like a $10,000 consulting deliverable.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert business analyst. Always respond with valid JSON only, no markdown formatting." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "competitive_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              overallAnalysis: { type: "string", description: "Executive summary of competitive landscape" },
              detectedIndustry: { type: "string", description: "Detected industry category" },
              strengths: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    explanation: { type: "string" }
                  },
                  required: ["title", "explanation"],
                  additionalProperties: false
                },
                description: "Business strengths"
              },
              weaknesses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    explanation: { type: "string" }
                  },
                  required: ["title", "explanation"],
                  additionalProperties: false
                },
                description: "Business weaknesses"
              },
              opportunities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    explanation: { type: "string" }
                  },
                  required: ["title", "explanation"],
                  additionalProperties: false
                },
                description: "Market opportunities"
              },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    impact: { type: "string", enum: ["High", "Medium", "Low"] },
                    action_plan: { type: "string" }
                  },
                  required: ["title", "description", "impact", "action_plan"],
                  additionalProperties: false
                },
                description: "Actionable recommendations with context"
              },
            },
            required: ["overallAnalysis", "detectedIndustry", "strengths", "weaknesses", "opportunities", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
    return {
      overallAnalysis: parsed.overallAnalysis,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      opportunities: parsed.opportunities,
      recommendations: parsed.recommendations,
      detectedIndustry: parsed.detectedIndustry,
    };

  } catch (error) {
    console.error("AI insights generation error:", error);

    // Return default insights on error
    return {
      overallAnalysis: "Unable to generate AI analysis at this time. Please review the competitor data manually.",
      strengths: [{ title: "Data collected successfully", explanation: "Data was gathered but AI analysis failed." }],
      weaknesses: [{ title: "AI analysis unavailable", explanation: "The AI service could not process the request." }],
      opportunities: [{ title: "Review competitor data manually", explanation: "Please check the competitor table for insights." }],
      recommendations: [{
        title: "Retry Analysis",
        description: "The AI service is temporarily unavailable. Please try again later.",
        impact: "High",
        action_plan: "Wait a few moments and restart the analysis."
      }],
    };
  }
}

/**
 * Generate competitive positioning score
 */
export function calculatePositioningScore(
  analysis: Analysis,
  competitors: Competitor[]
): { score: number; percentile: number; summary: string } {
  let score = 50; // Base score

  // SEO comparison
  const avgCompetitorSeo = competitors.reduce((sum, c) => sum + (c.seoScore || 0), 0) / (competitors.length || 1);
  if (analysis.seoScore) {
    const seoDiff = analysis.seoScore - avgCompetitorSeo;
    score += Math.min(15, Math.max(-15, seoDiff / 3));
  }

  // Rating comparison
  const avgCompetitorRating = competitors.reduce((sum, c) => sum + (parseFloat(c.googleRating?.toString() || "0")), 0) / (competitors.length || 1);
  if (analysis.googleRating) {
    const ratingDiff = parseFloat(analysis.googleRating.toString()) - avgCompetitorRating;
    score += ratingDiff * 10;
  }

  // Review count comparison
  const avgCompetitorReviews = competitors.reduce((sum, c) => sum + (c.googleReviewCount || 0), 0) / (competitors.length || 1);
  if (analysis.googleReviewCount) {
    const reviewRatio = analysis.googleReviewCount / (avgCompetitorReviews || 1);
    score += Math.min(10, (reviewRatio - 1) * 5);
  }

  // Online presence bonus
  if (analysis.hasGoogleBusiness) score += 5;
  if (analysis.businessUrl) score += 5;

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Calculate percentile (how many competitors you beat)
  const competitorScores = competitors.map(c => c.competitiveScore || 50);
  const beatenCount = competitorScores.filter(s => score > s).length;
  const percentile = Math.round((beatenCount / (competitors.length || 1)) * 100);

  // Generate summary
  let summary: string;
  if (score >= 75) {
    summary = "Strong competitive position - leading in most metrics";
  } else if (score >= 60) {
    summary = "Good competitive position - above average performance";
  } else if (score >= 40) {
    summary = "Average competitive position - room for improvement";
  } else {
    summary = "Weak competitive position - significant improvements needed";
  }

  return { score, percentile, summary };
}
