/**
 * Social Media Monitoring Service
 * Tracks competitors' social media activities across platforms
 * Uses free/public data sources and web scraping
 */

import { invokeLLM } from "../_core/llm";
import * as db from "../db";

export interface SocialMediaProfile {
  platform: "twitter" | "facebook" | "instagram" | "linkedin" | "youtube" | "tiktok";
  username: string;
  profileUrl: string;
  followers?: number;
  following?: number;
  totalPosts?: number;
}

export interface SocialMediaPost {
  platform: "twitter" | "facebook" | "instagram" | "linkedin" | "youtube" | "tiktok";
  postId?: string;
  postUrl?: string;
  content?: string;
  contentType: "text" | "image" | "video" | "link" | "carousel";
  mediaUrls?: string[];
  hashtags?: string[];
  mentions?: string[];
  likes: number;
  comments: number;
  shares: number;
  views?: number;
  engagementRate?: number;
  postedAt?: Date;
}

export interface SocialMediaMetrics {
  platform: "twitter" | "facebook" | "instagram" | "linkedin" | "youtube" | "tiktok";
  profileUrl: string;
  username: string;
  followers: number;
  following: number;
  totalPosts: number;
  postsPerWeek: number;
  avgEngagementRate: number;
  avgLikesPerPost: number;
  avgCommentsPerPost: number;
  avgSharesPerPost: number;
  textPostsPercent: number;
  imagePostsPercent: number;
  videoPostsPercent: number;
  topHashtags: string[];
  bestPostingTimes: string[];
}

export interface SocialMediaAlert {
  alertType: "viral_post" | "high_engagement" | "new_campaign" | "mention_spike" | "follower_surge";
  platform: "twitter" | "facebook" | "instagram" | "linkedin" | "youtube" | "tiktok";
  title: string;
  description: string;
  importance: "low" | "medium" | "high";
}

/**
 * Extract social media handles from a business website
 */
export async function extractSocialProfiles(websiteUrl: string, businessName: string): Promise<SocialMediaProfile[]> {
  const profiles: SocialMediaProfile[] = [];

  try {
    // Try to fetch the website and extract social links
    const response = await fetch(websiteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PhoenixIntel/1.0)",
      },
    });

    if (response.ok) {
      const html = await response.text();

      // Extract social media links using regex patterns
      const socialPatterns = [
        { platform: "twitter" as const, patterns: [/twitter\.com\/([a-zA-Z0-9_]+)/gi, /x\.com\/([a-zA-Z0-9_]+)/gi] },
        { platform: "facebook" as const, patterns: [/facebook\.com\/([a-zA-Z0-9._-]+)/gi] },
        { platform: "instagram" as const, patterns: [/instagram\.com\/([a-zA-Z0-9._]+)/gi] },
        { platform: "linkedin" as const, patterns: [/linkedin\.com\/company\/([a-zA-Z0-9-]+)/gi, /linkedin\.com\/in\/([a-zA-Z0-9-]+)/gi] },
        { platform: "youtube" as const, patterns: [/youtube\.com\/(channel|c|user|@)\/([a-zA-Z0-9_-]+)/gi] },
        { platform: "tiktok" as const, patterns: [/tiktok\.com\/@([a-zA-Z0-9._]+)/gi] },
      ];

      for (const { platform, patterns } of socialPatterns) {
        for (const pattern of patterns) {
          const matches = Array.from(html.matchAll(pattern));
          for (const match of matches) {
            const username = match[1] || match[2];
            if (username && !profiles.find(p => p.platform === platform)) {
              profiles.push({
                platform,
                username,
                profileUrl: match[0].startsWith("http") ? match[0] : `https://${match[0]}`,
              });
              break;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error extracting social profiles:", error);
  }

  // If no profiles found, try to generate likely handles based on business name
  if (profiles.length === 0) {
    const cleanName = businessName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const platforms: Array<"twitter" | "facebook" | "instagram" | "linkedin"> = ["twitter", "facebook", "instagram", "linkedin"];

    for (const platform of platforms) {
      profiles.push({
        platform,
        username: cleanName,
        profileUrl: getPlatformUrl(platform, cleanName),
      });
    }
  }

  return profiles;
}

function getPlatformUrl(platform: string, username: string): string {
  const urls: Record<string, string> = {
    twitter: `https://twitter.com/${username}`,
    facebook: `https://facebook.com/${username}`,
    instagram: `https://instagram.com/${username}`,
    linkedin: `https://linkedin.com/company/${username}`,
    youtube: `https://youtube.com/@${username}`,
    tiktok: `https://tiktok.com/@${username}`,
  };
  return urls[platform] || "";
}

/**
 * Generate social media metrics
 * NOTE: Previously used LLM to simulate data. Now returns empty structure to avoid false data.
 * In a production environment with Twitter/Facebook/LinkedIn API keys, this would fetch real data.
 */
export async function analyzeSocialMediaPresence(
  businessName: string,
  profiles: SocialMediaProfile[],
  industry: string
): Promise<{ metrics: SocialMediaMetrics[]; posts: SocialMediaPost[]; alerts: SocialMediaAlert[] }> {
  // We strictly return only verifiable data or empty arrays to avoid simulation.
  // Without expensive third-party APIs (e.g., HypeAuditor, SocialBlade), we cannot legally fetch these stats.

  const metrics: SocialMediaMetrics[] = profiles.map(p => ({
    platform: p.platform,
    profileUrl: p.profileUrl,
    username: p.username,
    followers: 0, // Cannot verify without API
    following: 0,
    totalPosts: 0,
    postsPerWeek: 0,
    avgEngagementRate: 0,
    avgLikesPerPost: 0,
    avgCommentsPerPost: 0,
    avgSharesPerPost: 0,
    textPostsPercent: 0,
    imagePostsPercent: 0,
    videoPostsPercent: 0,
    topHashtags: [],
    bestPostingTimes: []
  }));

  return {
    metrics,
    posts: [], // No fake posts
    alerts: [] // No fake alerts
  };
}

/**
 * Monitor social media for all competitors in an analysis
 */
export async function monitorCompetitorsSocialMedia(
  analysisId: number,
  competitors: Array<{ id: number; name: string; url: string | null; socialProfiles: unknown }>,
  industry: string
): Promise<void> {
  for (const competitor of competitors) {
    try {
      // Extract or use existing social profiles
      let profiles: SocialMediaProfile[] = [];

      if (competitor.socialProfiles && typeof competitor.socialProfiles === "object") {
        // Convert existing social profiles to our format
        const existing = competitor.socialProfiles as Record<string, string>;
        for (const [platform, url] of Object.entries(existing)) {
          if (url && ["twitter", "facebook", "instagram", "linkedin", "youtube", "tiktok"].includes(platform)) {
            const username = url.split("/").pop() || "";
            profiles.push({
              platform: platform as SocialMediaProfile["platform"],
              username,
              profileUrl: url,
            });
          }
        }
      }

      // If no profiles, try to extract from website
      if (profiles.length === 0 && competitor.url) {
        profiles = await extractSocialProfiles(competitor.url, competitor.name);
      }

      if (profiles.length === 0) {
        console.log(`No social profiles found for ${competitor.name}`);
        continue;
      }

      // Analyze social media presence
      const { metrics, posts, alerts } = await analyzeSocialMediaPresence(
        competitor.name,
        profiles,
        industry
      );

      // Save metrics to database
      for (const metric of metrics) {
        await db.saveSocialMediaMetric({
          competitorId: competitor.id,
          analysisId,
          platform: metric.platform as "twitter" | "facebook" | "instagram" | "linkedin" | "youtube" | "tiktok",
          profileUrl: metric.profileUrl,
          username: metric.username,
          followers: metric.followers,
          following: metric.following,
          totalPosts: metric.totalPosts,
          postsPerWeek: String(metric.postsPerWeek),
          avgEngagementRate: String(metric.avgEngagementRate),
          avgLikesPerPost: metric.avgLikesPerPost,
          avgCommentsPerPost: metric.avgCommentsPerPost,
          avgSharesPerPost: metric.avgSharesPerPost,
          textPostsPercent: metric.textPostsPercent,
          imagePostsPercent: metric.imagePostsPercent,
          videoPostsPercent: metric.videoPostsPercent,
          topHashtags: metric.topHashtags,
          bestPostingTimes: metric.bestPostingTimes,
        });
      }

      // Save posts to database
      for (const post of posts) {
        await db.saveSocialMediaPost({
          competitorId: competitor.id,
          analysisId,
          platform: post.platform as "twitter" | "facebook" | "instagram" | "linkedin" | "youtube" | "tiktok",
          postId: post.postId,
          postUrl: post.postUrl,
          content: post.content,
          contentType: post.contentType as "text" | "image" | "video" | "link" | "carousel",
          mediaUrls: post.mediaUrls,
          hashtags: post.hashtags,
          mentions: post.mentions,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          views: post.views,
          engagementRate: post.engagementRate ? String(post.engagementRate) : null,
          postedAt: post.postedAt,
        });
      }

      // Save alerts to database
      for (const alert of alerts) {
        await db.saveSocialMediaAlert({
          analysisId,
          competitorId: competitor.id,
          alertType: alert.alertType as "viral_post" | "high_engagement" | "new_campaign" | "mention_spike" | "follower_surge",
          platform: alert.platform as "twitter" | "facebook" | "instagram" | "linkedin" | "youtube" | "tiktok",
          title: alert.title,
          description: alert.description,
          importance: alert.importance as "low" | "medium" | "high",
        });
      }

      console.log(`Social media monitoring complete for ${competitor.name}`);
    } catch (error) {
      console.error(`Error monitoring social media for ${competitor.name}:`, error);
    }
  }
}

/**
 * Generate social media insights comparing competitors
 */
export async function generateSocialMediaInsights(
  analysisId: number,
  businessName: string
): Promise<{
  summary: string;
  topPerformer: string;
  recommendations: string[];
  platformComparison: Record<string, { leader: string; avgEngagement: number }>;
}> {
  try {
    const metrics = await db.getSocialMediaMetricsByAnalysisId(analysisId);
    const posts = await db.getSocialMediaPostsByAnalysisId(analysisId);

    if (metrics.length === 0) {
      return {
        summary: "No social media data available for analysis.",
        topPerformer: "N/A",
        recommendations: ["Establish social media presence to compete effectively."],
        platformComparison: {},
      };
    }

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a social media strategist. Analyze competitor social media data and provide actionable insights.",
        },
        {
          role: "user",
          content: `Analyze the social media performance of competitors for "${businessName}".

Metrics data:
${JSON.stringify(metrics, null, 2)}

Recent posts sample:
${JSON.stringify(posts.slice(0, 20), null, 2)}

Provide:
1. A brief summary of the competitive social media landscape
2. Who is the top performer and why
3. 3-5 specific recommendations for ${businessName} to improve their social media strategy
4. Platform-by-platform comparison showing the leader and average engagement

Return as JSON:
{
  "summary": "Brief analysis summary",
  "topPerformer": "Competitor name",
  "recommendations": ["rec1", "rec2", "rec3"],
  "platformComparison": {
    "twitter": { "leader": "name", "avgEngagement": number },
    "instagram": { "leader": "name", "avgEngagement": number }
  }
}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "social_insights",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              topPerformer: { type: "string" },
              recommendations: { type: "array", items: { type: "string" } },
              platformComparison: {
                type: "object",
                additionalProperties: {
                  type: "object",
                  properties: {
                    leader: { type: "string" },
                    avgEngagement: { type: "number" },
                  },
                  required: ["leader", "avgEngagement"],
                  additionalProperties: false,
                },
              },
            },
            required: ["summary", "topPerformer", "recommendations", "platformComparison"],
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
    console.error("Error generating social media insights:", error);
    return {
      summary: "Unable to generate insights at this time.",
      topPerformer: "N/A",
      recommendations: [],
      platformComparison: {},
    };
  }
}
