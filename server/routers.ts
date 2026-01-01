import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { runCompetitiveAnalysis } from "./services/analysisService";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Analysis endpoints
  analysis: router({
    // Create a new competitive analysis
    create: publicProcedure
      .input(z.object({
        businessName: z.string().min(1, "Business name is required"),
        businessUrl: z.string().url().optional().or(z.literal("")),
        businessLocation: z.string().min(1, "Location is required"),
        industry: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Use guest user (ID 0) if not authenticated
        const userId = ctx.user?.id || 0;

        const analysisId = await db.createAnalysis({
          userId,
          businessName: input.businessName,
          businessUrl: input.businessUrl || null,
          businessLocation: input.businessLocation,
          industry: input.industry || null,
          status: "pending",
        });

        // Start the analysis process asynchronously
        runCompetitiveAnalysis(analysisId).catch(err => {
          console.error(`Analysis ${analysisId} failed:`, err);
        });

        return { id: analysisId, status: "pending" };
      }),

    // Get a single analysis by ID
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.id);
        if (!analysis) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Analysis not found" });
        }

        // Security check: ensure the user owns the analysis
        const userId = ctx.user?.id || 0;
        if (analysis.userId !== userId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        const competitorsList = await db.getCompetitorsByAnalysisId(input.id);
        return { ...analysis, competitors: competitorsList };
      }),

    // List all analyses (public access)
    list: publicProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id || 0;
      return db.getAnalysesByUserId(userId);
    }),

    // Delete an analysis
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.deleteAnalysis(input.id, ctx.user.id);
        if (!success) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Analysis not found or access denied" });
        }
        return { success: true };
      }),

    // Regenerate content for an existing analysis
    regenerateContent: publicProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum(["blog", "adCopy", "all"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.id);
        if (!analysis) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Analysis not found" });
        }
        if (analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        // Import and run content generation
        const { generateContent } = await import("./services/contentService");
        const competitorsList = await db.getCompetitorsByAnalysisId(input.id);
        const result = await generateContent(analysis, competitorsList, input.type);

        return result;
      }),
  }),

  // Competitor endpoints
  competitor: router({
    // Get competitors for an analysis
    list: publicProcedure
      .input(z.object({ analysisId: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.analysisId);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        return db.getCompetitorsByAnalysisId(input.analysisId);
      }),
  }),

  // Benchmark endpoints
  benchmark: router({
    get: publicProcedure
      .input(z.object({ industry: z.string() }))
      .query(async ({ input }) => {
        return db.getOrCreateBenchmark(input.industry);
      }),
  }),

  // Social Media Monitoring endpoints
  socialMedia: router({
    // Get social media metrics for an analysis
    getMetrics: publicProcedure
      .input(z.object({ analysisId: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.analysisId);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        return db.getSocialMediaMetricsByAnalysisId(input.analysisId);
      }),

    // Get social media posts for an analysis
    getPosts: publicProcedure
      .input(z.object({
        analysisId: z.number(),
        competitorId: z.number().optional(),
        platform: z.enum(["twitter", "facebook", "instagram", "linkedin", "youtube", "tiktok"]).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.analysisId);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        if (input.competitorId) {
          return db.getSocialMediaPostsByCompetitorId(input.competitorId);
        }
        return db.getSocialMediaPostsByAnalysisId(input.analysisId);
      }),

    // Get social media alerts for an analysis
    getAlerts: publicProcedure
      .input(z.object({ analysisId: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.analysisId);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        return db.getSocialMediaAlertsByAnalysisId(input.analysisId);
      }),

    // Mark an alert as read
    markAlertRead: publicProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markAlertAsRead(input.alertId);
        return { success: true };
      }),

    // Get unread alerts count
    getUnreadCount: publicProcedure
      .input(z.object({ analysisId: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.analysisId);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        return db.getUnreadAlertsCount(input.analysisId);
      }),

    // Get social media insights
    getInsights: publicProcedure
      .input(z.object({ analysisId: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.analysisId);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        const { generateSocialMediaInsights } = await import("./services/socialMediaService");
        return generateSocialMediaInsights(input.analysisId, analysis.businessName);
      }),

    // Refresh social media data for an analysis
    refresh: publicProcedure
      .input(z.object({ analysisId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.analysisId);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        const competitors = await db.getCompetitorsByAnalysisId(input.analysisId);
        const { monitorCompetitorsSocialMedia } = await import("./services/socialMediaService");

        // Run monitoring asynchronously
        monitorCompetitorsSocialMedia(
          input.analysisId,
          competitors.map(c => ({
            id: c.id,
            name: c.name,
            url: c.url,
            socialProfiles: c.socialProfiles,
          })),
          analysis.industry || "general"
        ).catch(err => {
          console.error("Social media refresh failed:", err);
        });

        return { success: true, message: "Social media refresh started" };
      }),
  }),

  // Sentiment Analysis endpoints
  sentiment: router({
    // Get sentiment aggregates for an analysis
    getAggregates: publicProcedure
      .input(z.object({
        analysisId: z.number(),
        competitorId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.analysisId);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        if (input.competitorId) {
          return db.getSentimentAggregatesByCompetitorId(input.competitorId);
        }
        return db.getSentimentAggregatesByAnalysisId(input.analysisId);
      }),

    // Get posts with sentiment data
    getPostsWithSentiment: publicProcedure
      .input(z.object({ analysisId: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.analysisId);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        return db.getPostsWithSentiment(input.analysisId);
      }),

    // Run sentiment analysis for an analysis
    analyze: publicProcedure
      .input(z.object({ analysisId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.analysisId);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        const { analyzeAnalysisSentiment } = await import("./services/sentimentService");

        // Run analysis asynchronously
        analyzeAnalysisSentiment(input.analysisId).catch(err => {
          console.error("Sentiment analysis failed:", err);
        });

        return { success: true, message: "Sentiment analysis started" };
      }),

    // Get AI-generated sentiment insights
    getInsights: publicProcedure
      .input(z.object({ analysisId: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.analysisId);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        const { generateSentimentInsights } = await import("./services/sentimentService");
        return generateSentimentInsights(input.analysisId, analysis.businessName);
      }),
  }),
});

export type AppRouter = typeof appRouter;
