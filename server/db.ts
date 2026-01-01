import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  InsertUser, users,
  analyses, InsertAnalysis, Analysis,
  competitors, InsertCompetitor, Competitor,
  industryBenchmarks, InsertIndustryBenchmark,
  sentimentAggregates, InsertSentimentAggregate, SentimentAggregate,
  socialMediaPosts, InsertSocialMediaPost, SocialMediaPost,
  socialMediaMetrics, InsertSocialMediaMetric, SocialMediaMetric,
  socialMediaAlerts, InsertSocialMediaAlert, SocialMediaAlert
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: any = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Create connection pool for better performance and connection management
      // Pool size doubled for improved API connectivity
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        connectionLimit: 20, // Doubled from default 10
        maxIdle: 10, // Maximum idle connections
        idleTimeout: 60000, // 60 seconds
        queueLimit: 0, // Unlimited queue
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000, // 10 seconds
        waitForConnections: true,
        // Connection timeout settings
        connectTimeout: 10000, // 10 seconds
        // Performance optimizations
        multipleStatements: false,
        namedPlaceholders: true,
        // SSL configuration for Aiven and other cloud providers
        ssl: {
          rejectUnauthorized: false
        },
      });

      _db = drizzle(_pool);
      console.log("[Database] Connection pool initialized with 20 connections");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

export async function closeDb() {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
    console.log("[Database] Connection pool closed");
  }
}

// ==================== USER QUERIES ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== ANALYSIS QUERIES ====================

export async function createAnalysis(data: InsertAnalysis): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(analyses).values(data);
  return Number(result[0].insertId);
}

export async function getAnalysisById(id: number): Promise<Analysis | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1);
  return result[0];
}

export async function getAnalysesByUserId(userId: number): Promise<Analysis[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(analyses)
    .where(eq(analyses.userId, userId))
    .orderBy(desc(analyses.createdAt));
}

export async function updateAnalysis(id: number, data: Partial<InsertAnalysis>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(analyses).set(data).where(eq(analyses.id, id));
}

export async function deleteAnalysis(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // First delete associated competitors
  await db.delete(competitors).where(eq(competitors.analysisId, id));

  // Then delete the analysis
  const result = await db.delete(analyses).where(
    and(eq(analyses.id, id), eq(analyses.userId, userId))
  );
  return (result[0].affectedRows ?? 0) > 0;
}

// ==================== COMPETITOR QUERIES ====================

export async function createCompetitor(data: InsertCompetitor): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(competitors).values(data);
  return Number(result[0].insertId);
}

export async function createCompetitors(data: InsertCompetitor[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return;

  await db.insert(competitors).values(data);
}

export async function getCompetitorsByAnalysisId(analysisId: number): Promise<Competitor[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(competitors)
    .where(eq(competitors.analysisId, analysisId))
    .orderBy(desc(competitors.competitiveScore));
}

export async function updateCompetitor(id: number, data: Partial<InsertCompetitor>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(competitors).set(data).where(eq(competitors.id, id));
}

// ==================== BENCHMARK QUERIES ====================

export async function getOrCreateBenchmark(industry: string): Promise<InsertIndustryBenchmark> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(industryBenchmarks)
    .where(eq(industryBenchmarks.industry, industry))
    .limit(1);

  if (existing[0]) return existing[0];

  // Create default benchmark
  const defaultBenchmark: InsertIndustryBenchmark = {
    industry,
    avgSeoScore: 65,
    avgGoogleRating: "4.2",
    avgReviewCount: 50,
    avgContentWordCount: 800,
    topKeywords: [],
  };

  await db.insert(industryBenchmarks).values(defaultBenchmark);
  return defaultBenchmark;
}

export async function updateBenchmark(industry: string, data: Partial<InsertIndustryBenchmark>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(industryBenchmarks).set(data)
    .where(eq(industryBenchmarks.industry, industry));
}


// ==================== SOCIAL MEDIA QUERIES ====================

export async function saveSocialMediaPost(data: InsertSocialMediaPost): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(socialMediaPosts).values(data);
  return Number(result[0].insertId);
}

export async function getSocialMediaPostsByAnalysisId(analysisId: number): Promise<SocialMediaPost[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(socialMediaPosts)
    .where(eq(socialMediaPosts.analysisId, analysisId))
    .orderBy(desc(socialMediaPosts.postedAt));
}

export async function getSocialMediaPostsByCompetitorId(competitorId: number): Promise<SocialMediaPost[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(socialMediaPosts)
    .where(eq(socialMediaPosts.competitorId, competitorId))
    .orderBy(desc(socialMediaPosts.postedAt));
}

export async function saveSocialMediaMetric(data: InsertSocialMediaMetric): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(socialMediaMetrics).values(data);
  return Number(result[0].insertId);
}

export async function getSocialMediaMetricsByAnalysisId(analysisId: number): Promise<SocialMediaMetric[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(socialMediaMetrics)
    .where(eq(socialMediaMetrics.analysisId, analysisId))
    .orderBy(desc(socialMediaMetrics.fetchedAt));
}

export async function getSocialMediaMetricsByCompetitorId(competitorId: number): Promise<SocialMediaMetric[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(socialMediaMetrics)
    .where(eq(socialMediaMetrics.competitorId, competitorId))
    .orderBy(desc(socialMediaMetrics.fetchedAt));
}

export async function saveSocialMediaAlert(data: InsertSocialMediaAlert): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(socialMediaAlerts).values(data);
  return Number(result[0].insertId);
}

export async function getSocialMediaAlertsByAnalysisId(analysisId: number): Promise<SocialMediaAlert[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(socialMediaAlerts)
    .where(eq(socialMediaAlerts.analysisId, analysisId))
    .orderBy(desc(socialMediaAlerts.createdAt));
}

export async function markAlertAsRead(alertId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(socialMediaAlerts)
    .set({ isRead: 1 })
    .where(eq(socialMediaAlerts.id, alertId));
}

export async function getUnreadAlertsCount(analysisId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  // Optimized: Use SQL COUNT instead of fetching all rows
  const result = await db.select({ count: sql<number>`COUNT(*)` })
    .from(socialMediaAlerts)
    .where(and(
      eq(socialMediaAlerts.analysisId, analysisId),
      eq(socialMediaAlerts.isRead, 0)
    ));

  return Number(result[0]?.count ?? 0);
}


// ==================== SENTIMENT QUERIES ====================

export async function updateSocialMediaPostSentiment(
  postId: number,
  data: {
    sentiment: "positive" | "negative" | "neutral" | "mixed";
    sentimentScore: string;
    sentimentConfidence: string;
    emotionalTone: Record<string, number>;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(socialMediaPosts)
    .set({
      sentiment: data.sentiment,
      sentimentScore: data.sentimentScore,
      sentimentConfidence: data.sentimentConfidence,
      emotionalTone: data.emotionalTone,
    })
    .where(eq(socialMediaPosts.id, postId));
}

export async function saveSentimentAggregate(data: InsertSentimentAggregate): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(sentimentAggregates).values(data);
  return Number(result[0].insertId);
}

export async function getSentimentAggregatesByAnalysisId(analysisId: number): Promise<SentimentAggregate[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(sentimentAggregates)
    .where(eq(sentimentAggregates.analysisId, analysisId))
    .orderBy(desc(sentimentAggregates.createdAt));
}

export async function getSentimentAggregatesByCompetitorId(competitorId: number): Promise<SentimentAggregate[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(sentimentAggregates)
    .where(eq(sentimentAggregates.competitorId, competitorId))
    .orderBy(desc(sentimentAggregates.createdAt));
}

export async function getPostsWithSentiment(analysisId: number): Promise<Array<{
  id: number;
  competitorId: number;
  platform: string;
  content: string | null;
  sentiment: string | null;
  sentimentScore: string | null;
  emotionalTone: unknown;
  postedAt: Date | null;
}>> {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    id: socialMediaPosts.id,
    competitorId: socialMediaPosts.competitorId,
    platform: socialMediaPosts.platform,
    content: socialMediaPosts.content,
    sentiment: socialMediaPosts.sentiment,
    sentimentScore: socialMediaPosts.sentimentScore,
    emotionalTone: socialMediaPosts.emotionalTone,
    postedAt: socialMediaPosts.postedAt,
  }).from(socialMediaPosts)
    .where(eq(socialMediaPosts.analysisId, analysisId))
    .orderBy(desc(socialMediaPosts.postedAt));
}
