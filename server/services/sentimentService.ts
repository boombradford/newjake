import { invokeLLM } from "../_core/llm";
import * as db from "../db";

export interface SentimentResult {
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  score: number; // -1.0 to 1.0
  confidence: number; // 0.0 to 1.0
  emotionalTone: {
    joy: number;
    anger: number;
    sadness: number;
    fear: number;
    surprise: number;
  };
  topics: string[];
}

export interface AggregatedSentiment {
  totalPosts: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  mixedCount: number;
  avgSentimentScore: number;
  sentimentTrend: "improving" | "declining" | "stable";
  emotionalBreakdown: {
    joy: number;
    anger: number;
    sadness: number;
    fear: number;
    surprise: number;
  };
  positiveTopics: string[];
  negativeTopics: string[];
}

/**
 * Analyze sentiment of a single piece of content using AI
 */
export async function analyzeSentiment(content: string): Promise<SentimentResult> {
  if (!content || content.trim().length < 5) {
    return {
      sentiment: "neutral",
      score: 0,
      confidence: 0.5,
      emotionalTone: { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0 },
      topics: [],
    };
  }

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a sentiment analysis expert. Analyze the sentiment of social media posts and return structured JSON data.

Your analysis should include:
1. Overall sentiment classification (positive, negative, neutral, or mixed)
2. Sentiment score from -1.0 (very negative) to 1.0 (very positive)
3. Confidence level from 0.0 to 1.0
4. Emotional tone breakdown (joy, anger, sadness, fear, surprise) as percentages (0-100)
5. Key topics or themes mentioned

Be accurate and nuanced in your analysis. Consider:
- Sarcasm and irony
- Context and industry-specific language
- Emojis and informal language
- Overall tone and intent`,
        },
        {
          role: "user",
          content: `Analyze the sentiment of this social media post:

"${content}"

Return your analysis as JSON with this exact structure:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "score": number between -1.0 and 1.0,
  "confidence": number between 0.0 and 1.0,
  "emotionalTone": {
    "joy": number 0-100,
    "anger": number 0-100,
    "sadness": number 0-100,
    "fear": number 0-100,
    "surprise": number 0-100
  },
  "topics": ["topic1", "topic2", ...]
}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sentiment_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sentiment: {
                type: "string",
                enum: ["positive", "negative", "neutral", "mixed"],
              },
              score: { type: "number" },
              confidence: { type: "number" },
              emotionalTone: {
                type: "object",
                properties: {
                  joy: { type: "number" },
                  anger: { type: "number" },
                  sadness: { type: "number" },
                  fear: { type: "number" },
                  surprise: { type: "number" },
                },
                required: ["joy", "anger", "sadness", "fear", "surprise"],
                additionalProperties: false,
              },
              topics: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["sentiment", "score", "confidence", "emotionalTone", "topics"],
            additionalProperties: false,
          },
        },
      },
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent || typeof responseContent !== "string") {
      throw new Error("No response from LLM");
    }

    const result = JSON.parse(responseContent);
    
    // Normalize the score to be between -1 and 1
    const normalizedScore = Math.max(-1, Math.min(1, result.score));
    const normalizedConfidence = Math.max(0, Math.min(1, result.confidence));
    
    return {
      sentiment: result.sentiment,
      score: normalizedScore,
      confidence: normalizedConfidence,
      emotionalTone: {
        joy: Math.max(0, Math.min(100, result.emotionalTone.joy)),
        anger: Math.max(0, Math.min(100, result.emotionalTone.anger)),
        sadness: Math.max(0, Math.min(100, result.emotionalTone.sadness)),
        fear: Math.max(0, Math.min(100, result.emotionalTone.fear)),
        surprise: Math.max(0, Math.min(100, result.emotionalTone.surprise)),
      },
      topics: result.topics || [],
    };
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return {
      sentiment: "neutral",
      score: 0,
      confidence: 0.3,
      emotionalTone: { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0 },
      topics: [],
    };
  }
}

/**
 * Batch analyze sentiment for multiple posts
 */
export async function analyzeSentimentBatch(
  posts: Array<{ id: number; content: string }>
): Promise<Map<number, SentimentResult>> {
  const results = new Map<number, SentimentResult>();
  
  // Process in batches of 5 to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    const batchPromises = batch.map(async (post) => {
      const result = await analyzeSentiment(post.content);
      return { id: post.id, result };
    });
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ id, result }) => {
      results.set(id, result);
    });
    
    // Small delay between batches
    if (i + batchSize < posts.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

/**
 * Calculate aggregated sentiment for a competitor
 */
export function calculateAggregatedSentiment(
  posts: Array<{
    sentiment: string | null;
    sentimentScore: string | null;
    emotionalTone: unknown;
    postedAt: Date | null;
  }>
): AggregatedSentiment {
  const validPosts = posts.filter(p => p.sentiment && p.sentimentScore);
  
  if (validPosts.length === 0) {
    return {
      totalPosts: 0,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      mixedCount: 0,
      avgSentimentScore: 0,
      sentimentTrend: "stable",
      emotionalBreakdown: { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0 },
      positiveTopics: [],
      negativeTopics: [],
    };
  }
  
  // Count sentiments
  const counts = {
    positive: 0,
    negative: 0,
    neutral: 0,
    mixed: 0,
  };
  
  let totalScore = 0;
  const emotionalTotals = { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0 };
  
  validPosts.forEach(post => {
    const sentiment = post.sentiment as keyof typeof counts;
    if (sentiment in counts) {
      counts[sentiment]++;
    }
    totalScore += parseFloat(post.sentimentScore || "0");
    
    if (post.emotionalTone && typeof post.emotionalTone === "object") {
      const tone = post.emotionalTone as Record<string, number>;
      emotionalTotals.joy += tone.joy || 0;
      emotionalTotals.anger += tone.anger || 0;
      emotionalTotals.sadness += tone.sadness || 0;
      emotionalTotals.fear += tone.fear || 0;
      emotionalTotals.surprise += tone.surprise || 0;
    }
  });
  
  // Calculate trend based on recent vs older posts
  const sortedPosts = [...validPosts].sort((a, b) => {
    const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
    const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
    return dateB - dateA;
  });
  
  let trend: "improving" | "declining" | "stable" = "stable";
  if (sortedPosts.length >= 4) {
    const recentHalf = sortedPosts.slice(0, Math.floor(sortedPosts.length / 2));
    const olderHalf = sortedPosts.slice(Math.floor(sortedPosts.length / 2));
    
    const recentAvg = recentHalf.reduce((sum, p) => sum + parseFloat(p.sentimentScore || "0"), 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((sum, p) => sum + parseFloat(p.sentimentScore || "0"), 0) / olderHalf.length;
    
    const diff = recentAvg - olderAvg;
    if (diff > 0.1) trend = "improving";
    else if (diff < -0.1) trend = "declining";
  }
  
  return {
    totalPosts: validPosts.length,
    positiveCount: counts.positive,
    negativeCount: counts.negative,
    neutralCount: counts.neutral,
    mixedCount: counts.mixed,
    avgSentimentScore: totalScore / validPosts.length,
    sentimentTrend: trend,
    emotionalBreakdown: {
      joy: Math.round(emotionalTotals.joy / validPosts.length),
      anger: Math.round(emotionalTotals.anger / validPosts.length),
      sadness: Math.round(emotionalTotals.sadness / validPosts.length),
      fear: Math.round(emotionalTotals.fear / validPosts.length),
      surprise: Math.round(emotionalTotals.surprise / validPosts.length),
    },
    positiveTopics: [],
    negativeTopics: [],
  };
}

/**
 * Analyze sentiment for all posts in an analysis
 */
export async function analyzeAnalysisSentiment(analysisId: number): Promise<void> {
  try {
    // Get all posts for this analysis
    const posts = await db.getSocialMediaPostsByAnalysisId(analysisId);
    
    // Filter posts that don't have sentiment yet
    const postsToAnalyze = posts.filter(p => !p.sentiment && p.content);
    
    if (postsToAnalyze.length === 0) {
      console.log(`No posts to analyze for analysis ${analysisId}`);
      return;
    }
    
    console.log(`Analyzing sentiment for ${postsToAnalyze.length} posts`);
    
    // Analyze sentiment for each post
    const sentimentResults = await analyzeSentimentBatch(
      postsToAnalyze.map(p => ({ id: p.id, content: p.content || "" }))
    );
    
    // Update posts with sentiment data
    for (const [postId, result] of Array.from(sentimentResults.entries())) {
      await db.updateSocialMediaPostSentiment(postId, {
        sentiment: result.sentiment,
        sentimentScore: result.score.toString(),
        sentimentConfidence: result.confidence.toString(),
        emotionalTone: result.emotionalTone,
      });
    }
    
    // Calculate and save aggregated sentiment per competitor
    const competitors = await db.getCompetitorsByAnalysisId(analysisId);
    
    for (const competitor of competitors) {
      const competitorPosts = await db.getSocialMediaPostsByCompetitorId(competitor.id);
      const aggregated = calculateAggregatedSentiment(competitorPosts);
      
      // Save aggregate for all platforms combined
      await db.saveSentimentAggregate({
        analysisId,
        competitorId: competitor.id,
        platform: "all",
        totalPosts: aggregated.totalPosts,
        positiveCount: aggregated.positiveCount,
        negativeCount: aggregated.negativeCount,
        neutralCount: aggregated.neutralCount,
        mixedCount: aggregated.mixedCount,
        avgSentimentScore: aggregated.avgSentimentScore.toString(),
        sentimentTrend: aggregated.sentimentTrend,
        joyPercent: aggregated.emotionalBreakdown.joy,
        angerPercent: aggregated.emotionalBreakdown.anger,
        sadnessPercent: aggregated.emotionalBreakdown.sadness,
        fearPercent: aggregated.emotionalBreakdown.fear,
        surprisePercent: aggregated.emotionalBreakdown.surprise,
        positiveTopics: aggregated.positiveTopics,
        negativeTopics: aggregated.negativeTopics,
      });
      
      // Save aggregates per platform
      const platforms = ["twitter", "facebook", "instagram", "linkedin", "youtube", "tiktok"] as const;
      for (const platform of platforms) {
        const platformPosts = competitorPosts.filter(p => p.platform === platform);
        if (platformPosts.length > 0) {
          const platformAggregated = calculateAggregatedSentiment(platformPosts);
          await db.saveSentimentAggregate({
            analysisId,
            competitorId: competitor.id,
            platform,
            totalPosts: platformAggregated.totalPosts,
            positiveCount: platformAggregated.positiveCount,
            negativeCount: platformAggregated.negativeCount,
            neutralCount: platformAggregated.neutralCount,
            mixedCount: platformAggregated.mixedCount,
            avgSentimentScore: platformAggregated.avgSentimentScore.toString(),
            sentimentTrend: platformAggregated.sentimentTrend,
            joyPercent: platformAggregated.emotionalBreakdown.joy,
            angerPercent: platformAggregated.emotionalBreakdown.anger,
            sadnessPercent: platformAggregated.emotionalBreakdown.sadness,
            fearPercent: platformAggregated.emotionalBreakdown.fear,
            surprisePercent: platformAggregated.emotionalBreakdown.surprise,
            positiveTopics: platformAggregated.positiveTopics,
            negativeTopics: platformAggregated.negativeTopics,
          });
        }
      }
    }
    
    console.log(`Sentiment analysis completed for analysis ${analysisId}`);
  } catch (error) {
    console.error("Error in sentiment analysis:", error);
    throw error;
  }
}

/**
 * Generate AI insights about sentiment patterns
 */
export async function generateSentimentInsights(
  analysisId: number,
  businessName: string
): Promise<{
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  competitorComparison: Array<{
    name: string;
    sentiment: string;
    trend: string;
    insight: string;
  }>;
}> {
  try {
    const aggregates = await db.getSentimentAggregatesByAnalysisId(analysisId);
    const competitors = await db.getCompetitorsByAnalysisId(analysisId);
    
    if (aggregates.length === 0) {
      return {
        summary: "No sentiment data available yet. Run sentiment analysis to generate insights.",
        keyFindings: [],
        recommendations: [],
        competitorComparison: [],
      };
    }
    
    // Build context for AI
    const competitorData = competitors.map(c => {
      const allPlatformAggregate = aggregates.find(
        a => a.competitorId === c.id && a.platform === "all"
      );
      return {
        name: c.name,
        avgScore: allPlatformAggregate?.avgSentimentScore || "0",
        trend: allPlatformAggregate?.sentimentTrend || "stable",
        positive: allPlatformAggregate?.positiveCount || 0,
        negative: allPlatformAggregate?.negativeCount || 0,
        neutral: allPlatformAggregate?.neutralCount || 0,
        joy: allPlatformAggregate?.joyPercent || 0,
        anger: allPlatformAggregate?.angerPercent || 0,
      };
    });
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a competitive intelligence analyst specializing in social media sentiment analysis. Generate actionable insights based on sentiment data.`,
        },
        {
          role: "user",
          content: `Analyze the sentiment data for competitors of "${businessName}":

${JSON.stringify(competitorData, null, 2)}

Generate insights in JSON format:
{
  "summary": "Brief 2-3 sentence summary of overall sentiment landscape",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "competitorComparison": [
    {
      "name": "competitor name",
      "sentiment": "positive/negative/neutral/mixed",
      "trend": "improving/declining/stable",
      "insight": "specific insight about this competitor"
    }
  ]
}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sentiment_insights",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              keyFindings: { type: "array", items: { type: "string" } },
              recommendations: { type: "array", items: { type: "string" } },
              competitorComparison: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    sentiment: { type: "string" },
                    trend: { type: "string" },
                    insight: { type: "string" },
                  },
                  required: ["name", "sentiment", "trend", "insight"],
                  additionalProperties: false,
                },
              },
            },
            required: ["summary", "keyFindings", "recommendations", "competitorComparison"],
            additionalProperties: false,
          },
        },
      },
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from LLM");
    }
    
    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating sentiment insights:", error);
    return {
      summary: "Unable to generate insights at this time.",
      keyFindings: [],
      recommendations: [],
      competitorComparison: [],
    };
  }
}
