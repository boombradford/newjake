import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

// Mock the database functions
vi.mock("./db", () => ({
  getAnalysisById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    businessName: "Test Business",
    businessUrl: "https://test.com",
    businessLocation: "New York, NY",
    industry: "Technology",
    status: "completed",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getSocialMediaMetricsByAnalysisId: vi.fn().mockResolvedValue([
    {
      id: 1,
      analysisId: 1,
      competitorId: 1,
      platform: "twitter",
      followers: 10000,
      following: 500,
      postsPerWeek: "5.0",
      avgEngagementRate: "3.5",
      avgLikes: 150,
      avgComments: 25,
      avgShares: 10,
      topHashtags: ["#tech", "#startup"],
      bestPostingTimes: ["9:00 AM", "2:00 PM"],
      textPostsPercent: 40,
      imagePostsPercent: 35,
      videoPostsPercent: 25,
      fetchedAt: new Date(),
    },
  ]),
  getSocialMediaPostsByAnalysisId: vi.fn().mockResolvedValue([
    {
      id: 1,
      analysisId: 1,
      competitorId: 1,
      platform: "twitter",
      postUrl: "https://twitter.com/test/status/123",
      content: "Test post content",
      contentType: "text",
      likes: 100,
      comments: 20,
      shares: 5,
      views: 1000,
      engagementRate: "3.5",
      hashtags: ["#test"],
      postedAt: new Date(),
      fetchedAt: new Date(),
    },
  ]),
  getSocialMediaPostsByCompetitorId: vi.fn().mockResolvedValue([]),
  getSocialMediaAlertsByAnalysisId: vi.fn().mockResolvedValue([
    {
      id: 1,
      analysisId: 1,
      competitorId: 1,
      platform: "twitter",
      alertType: "viral_post",
      title: "Viral Post Detected",
      description: "Competitor had a post go viral",
      importance: "high",
      isRead: 0,
      createdAt: new Date(),
    },
  ]),
  markAlertAsRead: vi.fn().mockResolvedValue(undefined),
  getUnreadAlertsCount: vi.fn().mockResolvedValue(3),
  getCompetitorsByAnalysisId: vi.fn().mockResolvedValue([
    {
      id: 1,
      analysisId: 1,
      name: "Competitor 1",
      url: "https://competitor1.com",
      socialProfiles: [{ platform: "twitter", username: "comp1" }],
    },
  ]),
}));

describe("socialMedia router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMetrics", () => {
    it("returns social media metrics for an analysis", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.socialMedia.getMetrics({ analysisId: 1 });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        platform: "twitter",
        followers: 10000,
        avgEngagementRate: "3.5",
      });
    });
  });

  describe("getPosts", () => {
    it("returns social media posts for an analysis", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.socialMedia.getPosts({ analysisId: 1 });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        platform: "twitter",
        content: "Test post content",
        likes: 100,
      });
    });
  });

  describe("getAlerts", () => {
    it("returns social media alerts for an analysis", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.socialMedia.getAlerts({ analysisId: 1 });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        alertType: "viral_post",
        importance: "high",
      });
    });
  });

  describe("markAlertRead", () => {
    it("marks an alert as read", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.socialMedia.markAlertRead({ alertId: 1 });

      expect(result).toEqual({ success: true });
    });
  });

  describe("getUnreadCount", () => {
    it("returns the count of unread alerts", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.socialMedia.getUnreadCount({ analysisId: 1 });

      expect(result).toBe(3);
    });
  });

  describe("refresh", () => {
    it("starts a social media refresh and returns success", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.socialMedia.refresh({ analysisId: 1 });

      expect(result).toEqual({
        success: true,
        message: "Social media refresh started",
      });
    });
  });
});
