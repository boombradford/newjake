import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }), // For local auth mode
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Competitive analyses - main analysis records
 */
export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),

  // Target business info
  businessName: varchar("businessName", { length: 255 }).notNull(),
  businessUrl: varchar("businessUrl", { length: 500 }),
  businessLocation: varchar("businessLocation", { length: 500 }).notNull(),
  industry: varchar("industry", { length: 255 }),

  // Analysis status
  status: mysqlEnum("status", ["pending", "collecting", "analyzing", "completed", "failed"]).default("pending").notNull(),

  // SEO metrics for target business
  seoScore: int("seoScore"),
  metaTitle: text("metaTitle"),
  metaDescription: text("metaDescription"),
  headingStructure: json("headingStructure"),
  contentWordCount: int("contentWordCount"),

  // Online presence metrics
  hasGoogleBusiness: int("hasGoogleBusiness"),
  googleRating: decimal("googleRating", { precision: 2, scale: 1 }),
  googleReviewCount: int("googleReviewCount"),
  socialProfiles: json("socialProfiles"),

  // AI-generated insights
  overallAnalysis: text("overallAnalysis"),
  strengths: json("strengths"),
  weaknesses: json("weaknesses"),
  opportunities: json("opportunities"),
  recommendations: json("recommendations"),

  // Generated content
  generatedBlogPost: text("generatedBlogPost"),
  generatedAdCopy: json("generatedAdCopy"),

  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;

/**
 * Competitors discovered for each analysis
 */
export const competitors = mysqlTable("competitors", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull(),

  // Basic info
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }),
  address: varchar("address", { length: 500 }),
  phone: varchar("phone", { length: 50 }),
  placeId: varchar("placeId", { length: 255 }),

  // Google Business metrics
  googleRating: decimal("googleRating", { precision: 2, scale: 1 }),
  googleReviewCount: int("googleReviewCount"),
  businessTypes: json("businessTypes"),

  // SEO metrics
  seoScore: int("seoScore"),
  metaTitle: text("metaTitle"),
  metaDescription: text("metaDescription"),
  headingStructure: json("headingStructure"),
  contentWordCount: int("contentWordCount"),
  topKeywords: json("topKeywords"),

  // Social presence
  socialProfiles: json("socialProfiles"),

  // External data enrichment
  employeeCount: varchar("employeeCount", { length: 50 }),
  fundingInfo: text("fundingInfo"),
  techStack: json("techStack"),
  recentNews: json("recentNews"),

  // Comparison scores (vs target business)
  competitiveScore: int("competitiveScore"),
  threatLevel: mysqlEnum("threatLevel", ["low", "medium", "high"]),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Competitor = typeof competitors.$inferSelect;
export type InsertCompetitor = typeof competitors.$inferInsert;

/**
 * Industry benchmarks for comparison
 */
export const industryBenchmarks = mysqlTable("industryBenchmarks", {
  id: int("id").autoincrement().primaryKey(),
  industry: varchar("industry", { length: 255 }).notNull().unique(),
  avgSeoScore: int("avgSeoScore"),
  avgGoogleRating: decimal("avgGoogleRating", { precision: 2, scale: 1 }),
  avgReviewCount: int("avgReviewCount"),
  avgContentWordCount: int("avgContentWordCount"),
  topKeywords: json("topKeywords"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IndustryBenchmark = typeof industryBenchmarks.$inferSelect;
export type InsertIndustryBenchmark = typeof industryBenchmarks.$inferInsert;


/**
 * Social media posts tracked for competitors
 */
export const socialMediaPosts = mysqlTable("socialMediaPosts", {
  id: int("id").autoincrement().primaryKey(),
  competitorId: int("competitorId").notNull(),
  analysisId: int("analysisId").notNull(),

  // Platform info
  platform: mysqlEnum("platform", ["twitter", "facebook", "instagram", "linkedin", "youtube", "tiktok"]).notNull(),
  postId: varchar("postId", { length: 255 }),
  postUrl: varchar("postUrl", { length: 500 }),

  // Content
  content: text("content"),
  contentType: mysqlEnum("contentType", ["text", "image", "video", "link", "carousel"]).default("text"),
  mediaUrls: json("mediaUrls"),
  hashtags: json("hashtags"),
  mentions: json("mentions"),

  // Engagement metrics
  likes: int("likes").default(0),
  comments: int("comments").default(0),
  shares: int("shares").default(0),
  views: int("views"),
  engagementRate: decimal("engagementRate", { precision: 5, scale: 2 }),

  // Sentiment analysis
  sentiment: mysqlEnum("sentiment", ["positive", "negative", "neutral", "mixed"]),
  sentimentScore: decimal("sentimentScore", { precision: 4, scale: 3 }), // -1.0 to 1.0
  sentimentConfidence: decimal("sentimentConfidence", { precision: 4, scale: 3 }), // 0.0 to 1.0
  emotionalTone: json("emotionalTone"), // {joy, anger, sadness, fear, surprise}

  // Timestamps
  postedAt: timestamp("postedAt"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
export type InsertSocialMediaPost = typeof socialMediaPosts.$inferInsert;

/**
 * Social media profile metrics over time
 */
export const socialMediaMetrics = mysqlTable("socialMediaMetrics", {
  id: int("id").autoincrement().primaryKey(),
  competitorId: int("competitorId").notNull(),
  analysisId: int("analysisId").notNull(),

  // Platform info
  platform: mysqlEnum("platform", ["twitter", "facebook", "instagram", "linkedin", "youtube", "tiktok"]).notNull(),
  profileUrl: varchar("profileUrl", { length: 500 }),
  username: varchar("username", { length: 255 }),

  // Profile metrics
  followers: int("followers"),
  following: int("following"),
  totalPosts: int("totalPosts"),

  // Activity metrics (calculated)
  postsPerWeek: decimal("postsPerWeek", { precision: 5, scale: 2 }),
  avgEngagementRate: decimal("avgEngagementRate", { precision: 5, scale: 2 }),
  avgLikesPerPost: int("avgLikesPerPost"),
  avgCommentsPerPost: int("avgCommentsPerPost"),
  avgSharesPerPost: int("avgSharesPerPost"),

  // Content breakdown (percentages)
  textPostsPercent: int("textPostsPercent"),
  imagePostsPercent: int("imagePostsPercent"),
  videoPostsPercent: int("videoPostsPercent"),

  // Top performing content
  topHashtags: json("topHashtags"),
  bestPostingTimes: json("bestPostingTimes"),

  // Timestamps
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialMediaMetric = typeof socialMediaMetrics.$inferSelect;
export type InsertSocialMediaMetric = typeof socialMediaMetrics.$inferInsert;

/**
 * Social media monitoring alerts
 */
export const socialMediaAlerts = mysqlTable("socialMediaAlerts", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull(),
  competitorId: int("competitorId").notNull(),

  // Alert info
  alertType: mysqlEnum("alertType", ["viral_post", "high_engagement", "new_campaign", "mention_spike", "follower_surge"]).notNull(),
  platform: mysqlEnum("platform", ["twitter", "facebook", "instagram", "linkedin", "youtube", "tiktok"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),

  // Related post (if applicable)
  postId: int("postId"),

  // Alert status
  isRead: int("isRead").default(0),
  importance: mysqlEnum("importance", ["low", "medium", "high"]).default("medium"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialMediaAlert = typeof socialMediaAlerts.$inferSelect;
export type InsertSocialMediaAlert = typeof socialMediaAlerts.$inferInsert;


/**
 * Sentiment analysis aggregates per competitor
 */
export const sentimentAggregates = mysqlTable("sentimentAggregates", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull(),
  competitorId: int("competitorId").notNull(),
  platform: mysqlEnum("platform", ["twitter", "facebook", "instagram", "linkedin", "youtube", "tiktok", "all"]).notNull(),

  // Aggregate sentiment metrics
  totalPosts: int("totalPosts").default(0),
  positiveCount: int("positiveCount").default(0),
  negativeCount: int("negativeCount").default(0),
  neutralCount: int("neutralCount").default(0),
  mixedCount: int("mixedCount").default(0),

  // Calculated scores
  avgSentimentScore: decimal("avgSentimentScore", { precision: 4, scale: 3 }), // -1.0 to 1.0
  sentimentTrend: mysqlEnum("sentimentTrend", ["improving", "declining", "stable"]),

  // Emotional breakdown (percentages)
  joyPercent: int("joyPercent"),
  angerPercent: int("angerPercent"),
  sadnessPercent: int("sadnessPercent"),
  fearPercent: int("fearPercent"),
  surprisePercent: int("surprisePercent"),

  // Top topics by sentiment
  positiveTopics: json("positiveTopics"),
  negativeTopics: json("negativeTopics"),

  // Time period
  periodStart: timestamp("periodStart"),
  periodEnd: timestamp("periodEnd"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SentimentAggregate = typeof sentimentAggregates.$inferSelect;
export type InsertSentimentAggregate = typeof sentimentAggregates.$inferInsert;
