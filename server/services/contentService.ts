import { invokeLLM } from "../_core/llm";
import { Analysis, Competitor } from "../../drizzle/schema";
import * as db from "../db";

interface ContentGenerationResult {
  blogPost?: string;
  adCopy?: Array<{
    headline: string;
    description: string;
    callToAction: string;
    platform: string;
  }>;
}

/**
 * Generate SEO blog post and ad copy based on competitive analysis
 */
export async function generateContent(
  analysis: Analysis,
  competitors: Competitor[],
  type: "blog" | "adCopy" | "all"
): Promise<ContentGenerationResult> {
  const result: ContentGenerationResult = {};

  // Extract top keywords from competitors
  const allKeywords: string[] = [];
  for (const comp of competitors) {
    if (Array.isArray(comp.topKeywords)) {
      allKeywords.push(...(comp.topKeywords as string[]));
    }
  }
  const uniqueKeywords = Array.from(new Set(allKeywords)).slice(0, 15);

  if (type === "blog" || type === "all") {
    result.blogPost = await generateBlogPost(analysis, competitors, uniqueKeywords);
    
    // Save to database
    await db.updateAnalysis(analysis.id, { generatedBlogPost: result.blogPost });
  }

  if (type === "adCopy" || type === "all") {
    result.adCopy = await generateAdCopy(analysis, competitors, uniqueKeywords);
    
    // Save to database
    await db.updateAnalysis(analysis.id, { generatedAdCopy: result.adCopy });
  }

  return result;
}

/**
 * Generate a 1,500-word SEO blog post
 */
async function generateBlogPost(
  analysis: Analysis,
  competitors: Competitor[],
  keywords: string[]
): Promise<string> {
  try {
    const competitorInsights = competitors.slice(0, 3).map(c => 
      `${c.name}: ${c.googleRating || "N/A"} rating, ${c.googleReviewCount || 0} reviews`
    ).join("; ");

    const prompt = `Write a comprehensive, SEO-optimized blog post for ${analysis.businessName}, a ${analysis.industry || "business"} located in ${analysis.businessLocation}.

TARGET KEYWORDS TO INCLUDE NATURALLY:
${keywords.join(", ")}

COMPETITIVE CONTEXT:
- Main competitors: ${competitorInsights}
- Target business rating: ${analysis.googleRating || "N/A"}
- Target business reviews: ${analysis.googleReviewCount || 0}

REQUIREMENTS:
1. Write approximately 1,500 words (minimum 1,200 words)
2. Use an engaging, professional tone
3. Include the target keywords naturally throughout the content
4. Structure with clear H2 and H3 headings
5. Include a compelling introduction and conclusion
6. Add practical tips and actionable advice
7. Mention what makes this business unique compared to competitors
8. Include a call-to-action at the end

FORMAT:
- Use markdown formatting
- Include at least 5 H2 sections
- Add bullet points or numbered lists where appropriate
- Make it scannable and reader-friendly

Write the complete blog post now:`;

    const response = await invokeLLM({
      messages: [
        { 
          role: "system", 
          content: "You are an expert SEO content writer who creates engaging, informative blog posts that rank well in search engines while providing genuine value to readers." 
        },
        { role: "user", content: prompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content : "Unable to generate blog post. Please try again.";

  } catch (error) {
    console.error("Blog post generation error:", error);
    return "Unable to generate blog post at this time. Please try again later.";
  }
}

/**
 * Generate multiple ad copy variations
 */
async function generateAdCopy(
  analysis: Analysis,
  competitors: Competitor[],
  keywords: string[]
): Promise<ContentGenerationResult["adCopy"]> {
  try {
    const competitorStrengths = competitors.slice(0, 3).map(c => {
      const strengths = [];
      if (c.googleRating && parseFloat(c.googleRating.toString()) >= 4.5) {
        strengths.push("high ratings");
      }
      if (c.googleReviewCount && c.googleReviewCount > 100) {
        strengths.push("many reviews");
      }
      return `${c.name}: ${strengths.join(", ") || "standard presence"}`;
    }).join("; ");

    const prompt = `Create compelling ad copy variations for ${analysis.businessName}, a ${analysis.industry || "business"} in ${analysis.businessLocation}.

BUSINESS CONTEXT:
- Rating: ${analysis.googleRating || "N/A"} stars
- Reviews: ${analysis.googleReviewCount || 0}
- Competitors: ${competitorStrengths}

TARGET KEYWORDS:
${keywords.slice(0, 8).join(", ")}

Generate 6 different ad copy variations optimized for different platforms. Return as JSON array with this structure:
[
  {
    "headline": "Attention-grabbing headline (max 30 chars for Google, 40 for Facebook)",
    "description": "Compelling description highlighting unique value (max 90 chars for Google, 125 for Facebook)",
    "callToAction": "Strong CTA like 'Book Now', 'Get Quote', 'Learn More'",
    "platform": "google|facebook|instagram"
  }
]

Create:
- 2 Google Ads variations (shorter, keyword-focused)
- 2 Facebook Ad variations (emotional, benefit-focused)
- 2 Instagram Ad variations (trendy, visual-focused)

Focus on:
1. Differentiating from competitors
2. Highlighting unique selling points
3. Creating urgency or curiosity
4. Including relevant keywords naturally

Return ONLY the JSON array, no additional text.`;

    const response = await invokeLLM({
      messages: [
        { 
          role: "system", 
          content: "You are an expert digital marketing copywriter specializing in high-converting ad copy. Always respond with valid JSON only." 
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ad_copy_variations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              ads: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    headline: { type: "string" },
                    description: { type: "string" },
                    callToAction: { type: "string" },
                    platform: { type: "string" },
                  },
                  required: ["headline", "description", "callToAction", "platform"],
                  additionalProperties: false,
                },
              },
            },
            required: ["ads"],
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
    return parsed.ads || [];

  } catch (error) {
    console.error("Ad copy generation error:", error);
    
    // Return default ad copy on error
    return [
      {
        headline: `${analysis.businessName} - Local Expert`,
        description: `Trusted ${analysis.industry || "business"} in ${analysis.businessLocation}. Quality service you can count on.`,
        callToAction: "Learn More",
        platform: "google",
      },
      {
        headline: `Discover ${analysis.businessName}`,
        description: `Your local ${analysis.industry || "business"} partner. See why customers choose us.`,
        callToAction: "Get Started",
        platform: "facebook",
      },
    ];
  }
}
