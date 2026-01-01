import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Mock the database module
vi.mock("./db", () => ({
  createAnalysis: vi.fn(),
  getAnalysisById: vi.fn(),
  getAnalysesByUserId: vi.fn(),
  deleteAnalysis: vi.fn(),
  getCompetitorsByAnalysisId: vi.fn(),
  getOrCreateBenchmark: vi.fn(),
}));

// Mock the analysis service to prevent actual API calls
vi.mock("./services/analysisService", () => ({
  runCompetitiveAnalysis: vi.fn().mockResolvedValue(undefined),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user-open-id",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "local",
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
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("analysis.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new analysis and returns the id", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.createAnalysis).mockResolvedValue(123);

    const result = await caller.analysis.create({
      businessName: "Test Coffee Shop",
      businessLocation: "123 Main St, Austin, TX",
      businessUrl: "https://testcoffee.com",
      industry: "Coffee Shop",
    });

    expect(result).toEqual({ id: 123, status: "pending" });
    expect(db.createAnalysis).toHaveBeenCalledWith({
      userId: 1,
      businessName: "Test Coffee Shop",
      businessUrl: "https://testcoffee.com",
      businessLocation: "123 Main St, Austin, TX",
      industry: "Coffee Shop",
      status: "pending",
    });
  });

  it("handles empty optional fields correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.createAnalysis).mockResolvedValue(456);

    const result = await caller.analysis.create({
      businessName: "Simple Business",
      businessLocation: "New York, NY",
      businessUrl: "",
      industry: "",
    });

    expect(result).toEqual({ id: 456, status: "pending" });
    expect(db.createAnalysis).toHaveBeenCalledWith({
      userId: 1,
      businessName: "Simple Business",
      businessUrl: null,
      businessLocation: "New York, NY",
      industry: null,
      status: "pending",
    });
  });

  it("validates required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.analysis.create({
        businessName: "",
        businessLocation: "Austin, TX",
      })
    ).rejects.toThrow();
  });
});

describe("analysis.get", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns analysis with competitors for authorized user", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const mockAnalysis = {
      id: 1,
      userId: 1,
      businessName: "Test Business",
      businessLocation: "Austin, TX",
      businessUrl: "https://test.com",
      industry: "Restaurant",
      status: "completed" as const,
      seoScore: 75,
      googleRating: "4.5",
      googleReviewCount: 120,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
      overallAnalysis: "Great business",
      strengths: ["Good reviews"],
      weaknesses: ["Limited hours"],
      opportunities: ["Expand delivery"],
      recommendations: ["Add online ordering"],
      generatedBlogPost: "Blog content here",
      generatedAdCopy: [],
    };

    const mockCompetitors = [
      {
        id: 1,
        analysisId: 1,
        name: "Competitor 1",
        url: "https://comp1.com",
        address: "456 Oak St",
        phone: "555-1234",
        placeId: "place123",
        googleRating: "4.2",
        googleReviewCount: 80,
        businessTypes: ["restaurant"],
        seoScore: 65,
        metaTitle: "Competitor 1",
        metaDescription: "A great restaurant",
        headingStructure: {},
        contentWordCount: 500,
        topKeywords: ["food", "dining"],
        socialProfiles: {},
        employeeCount: "10-50",
        fundingInfo: null,
        techStack: ["wordpress"],
        recentNews: [],
        competitiveScore: 70,
        threatLevel: "medium" as const,
        createdAt: new Date(),
      },
    ];

    vi.mocked(db.getAnalysisById).mockResolvedValue(mockAnalysis);
    vi.mocked(db.getCompetitorsByAnalysisId).mockResolvedValue(mockCompetitors);

    const result = await caller.analysis.get({ id: 1 });

    expect(result.id).toBe(1);
    expect(result.businessName).toBe("Test Business");
    expect(result.competitors).toHaveLength(1);
    expect(result.competitors[0].name).toBe("Competitor 1");
  });

  it("throws NOT_FOUND for non-existent analysis", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.getAnalysisById).mockResolvedValue(null);

    await expect(caller.analysis.get({ id: 999 })).rejects.toThrow("Analysis not found");
  });

  it("throws FORBIDDEN when accessing another user's analysis", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.getAnalysisById).mockResolvedValue({
      id: 1,
      userId: 2, // Different user
      businessName: "Other Business",
      businessLocation: "Chicago, IL",
      businessUrl: null,
      industry: null,
      status: "completed",
      seoScore: null,
      googleRating: null,
      googleReviewCount: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      overallAnalysis: null,
      strengths: null,
      weaknesses: null,
      opportunities: null,
      recommendations: null,
      generatedBlogPost: null,
      generatedAdCopy: null,
    });

    await expect(caller.analysis.get({ id: 1 })).rejects.toThrow("Access denied");
  });
});

describe("analysis.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all analyses for the current user", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const mockAnalyses = [
      {
        id: 1,
        userId: 1,
        businessName: "Business 1",
        businessLocation: "Austin, TX",
        businessUrl: null,
        industry: "Restaurant",
        status: "completed" as const,
        seoScore: 75,
        googleRating: "4.5",
        googleReviewCount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        overallAnalysis: null,
        strengths: null,
        weaknesses: null,
        opportunities: null,
        recommendations: null,
        generatedBlogPost: null,
        generatedAdCopy: null,
      },
      {
        id: 2,
        userId: 1,
        businessName: "Business 2",
        businessLocation: "Dallas, TX",
        businessUrl: "https://biz2.com",
        industry: "Retail",
        status: "pending" as const,
        seoScore: null,
        googleRating: null,
        googleReviewCount: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        overallAnalysis: null,
        strengths: null,
        weaknesses: null,
        opportunities: null,
        recommendations: null,
        generatedBlogPost: null,
        generatedAdCopy: null,
      },
    ];

    vi.mocked(db.getAnalysesByUserId).mockResolvedValue(mockAnalyses);

    const result = await caller.analysis.list();

    expect(result).toHaveLength(2);
    expect(result[0].businessName).toBe("Business 1");
    expect(result[1].businessName).toBe("Business 2");
    expect(db.getAnalysesByUserId).toHaveBeenCalledWith(1);
  });

  it("returns empty array when user has no analyses", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.getAnalysesByUserId).mockResolvedValue([]);

    const result = await caller.analysis.list();

    expect(result).toEqual([]);
  });
});

describe("analysis.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes analysis and returns success", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.deleteAnalysis).mockResolvedValue(true);

    const result = await caller.analysis.delete({ id: 1 });

    expect(result).toEqual({ success: true });
    expect(db.deleteAnalysis).toHaveBeenCalledWith(1, 1);
  });

  it("throws NOT_FOUND when analysis doesn't exist or belongs to another user", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.deleteAnalysis).mockResolvedValue(false);

    await expect(caller.analysis.delete({ id: 999 })).rejects.toThrow(
      "Analysis not found or access denied"
    );
  });
});

describe("benchmark.get", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns benchmark data for an industry", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const mockBenchmark = {
      id: 1,
      industry: "Restaurant",
      avgSeoScore: 65,
      avgGoogleRating: "4.2",
      avgReviewCount: 150,
      avgContentLength: 800,
      topKeywords: ["food", "dining", "restaurant"],
      socialPresenceRate: 0.75,
      updatedAt: new Date(),
    };

    vi.mocked(db.getOrCreateBenchmark).mockResolvedValue(mockBenchmark);

    const result = await caller.benchmark.get({ industry: "Restaurant" });

    expect(result.industry).toBe("Restaurant");
    expect(result.avgSeoScore).toBe(65);
    expect(db.getOrCreateBenchmark).toHaveBeenCalledWith("Restaurant");
  });
});
