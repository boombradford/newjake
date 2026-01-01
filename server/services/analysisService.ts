import * as db from "../db";
import { discoverCompetitors } from "./competitorDiscoveryService";
import { analyzeSEO } from "./seoService";
import { analyzeOnlinePresence } from "./presenceService";
import { generateAIInsights } from "./aiInsightsService";
import { generateContent } from "./contentService";
import { enrichCompetitorData } from "./enrichmentService";

/**
 * Main orchestration function for running a complete competitive analysis
 */
export async function runCompetitiveAnalysis(analysisId: number): Promise<void> {
  try {
    // Update status to collecting
    await db.updateAnalysis(analysisId, { status: "collecting" });

    const analysis = await db.getAnalysisById(analysisId);
    if (!analysis) {
      throw new Error(`Analysis ${analysisId} not found`);
    }

    console.log(`[Analysis ${analysisId}] Starting competitive analysis for ${analysis.businessName}`);

    // Step 1: Analyze target business SEO (if URL provided)
    let targetSeoData = null;
    if (analysis.businessUrl) {
      console.log(`[Analysis ${analysisId}] Analyzing target business SEO...`);
      targetSeoData = await analyzeSEO(analysis.businessUrl);
      await db.updateAnalysis(analysisId, {
        seoScore: targetSeoData.score,
        metaTitle: targetSeoData.metaTitle,
        metaDescription: targetSeoData.metaDescription,
        headingStructure: targetSeoData.headings,
        contentWordCount: targetSeoData.wordCount,
      });
    }

    // Step 2: Analyze target business online presence
    console.log(`[Analysis ${analysisId}] Analyzing online presence...`);
    const presenceData = await analyzeOnlinePresence(
      analysis.businessName,
      analysis.businessLocation
    );
    await db.updateAnalysis(analysisId, {
      hasGoogleBusiness: presenceData.hasGoogleBusiness ? 1 : 0,
      googleRating: presenceData.googleRating?.toString() || null,
      googleReviewCount: presenceData.reviewCount,
      socialProfiles: presenceData.socialProfiles,
    });

    // Step 3: Discover competitors using Google Maps
    console.log(`[Analysis ${analysisId}] Discovering competitors...`);

    // Better industry detection: don't let generic types override user input
    // Google Maps often returns "point_of_interest" for specific businesses if queried via findPlace
    const genericTypes = ["point of interest", "point_of_interest", "establishment", "premise", "subpremise", "political", "locality", "route", "intersection", "finance"];
    let detectedIndustry = analysis.industry;

    const detectedType = presenceData.primaryType;
    const isGeneric = detectedType && genericTypes.some(t => detectedType.toLowerCase() === t);

    // Only use detected type if it's NOT generic and we don't have a better user input
    if (detectedType && !isGeneric) {
      if (!detectedIndustry) {
        detectedIndustry = detectedType;
        // Update industry since we found a good one
        await db.updateAnalysis(analysisId, { industry: detectedType });
      }
    }

    const discoveredCompetitors = await discoverCompetitors(
      analysis.businessName,
      analysis.businessLocation,
      detectedIndustry || undefined
    );

    // Step 4: Analyze each competitor (PARALLELIZED for 2x performance)
    console.log(`[Analysis ${analysisId}] Analyzing ${discoveredCompetitors.length} competitors in parallel...`);

    // Process competitors in parallel instead of sequentially
    const competitorPromises = discoveredCompetitors.slice(0, 5).map(async (comp) => {
      const competitorData: any = {
        analysisId,
        name: comp.name,
        url: comp.website || null,
        address: comp.address || null,
        phone: comp.phone || null,
        placeId: comp.placeId || null,
        googleRating: comp.rating?.toString() || null,
        googleReviewCount: comp.reviewCount || null,
        businessTypes: comp.types || [],
      };

      // Run SEO analysis and enrichment in parallel
      const [compSeo, enrichedData] = await Promise.all([
        // Analyze competitor SEO if they have a website
        comp.website ? analyzeSEO(comp.website).catch(err => {
          console.warn(`[Analysis ${analysisId}] SEO analysis failed for ${comp.name}:`, err.message);
          return null;
        }) : Promise.resolve(null),
        // Enrich with external data
        enrichCompetitorData(comp.name, comp.website).catch(err => {
          console.warn(`[Analysis ${analysisId}] Enrichment failed for ${comp.name}:`, err.message);
          return { employeeCount: null, fundingInfo: null, techStack: null, recentNews: null };
        })
      ]);

      if (compSeo) {
        competitorData.seoScore = compSeo.score;
        competitorData.metaTitle = compSeo.metaTitle;
        competitorData.metaDescription = compSeo.metaDescription;
        competitorData.headingStructure = compSeo.headings;
        competitorData.contentWordCount = compSeo.wordCount;
        competitorData.topKeywords = compSeo.topKeywords;
      }

      competitorData.employeeCount = enrichedData.employeeCount;
      competitorData.fundingInfo = enrichedData.fundingInfo;
      competitorData.techStack = enrichedData.techStack;
      competitorData.recentNews = enrichedData.recentNews;

      // Calculate competitive score
      competitorData.competitiveScore = calculateCompetitiveScore(competitorData, targetSeoData);
      competitorData.threatLevel = getThreatLevel(competitorData.competitiveScore);

      return competitorData;
    });

    // Wait for all competitor analyses to complete
    const competitorDataList = await Promise.all(competitorPromises);

    // Save all competitors
    if (competitorDataList.length > 0) {
      await db.createCompetitors(competitorDataList);
    }

    // Update status to analyzing
    await db.updateAnalysis(analysisId, { status: "analyzing" });

    // Step 5: Generate AI insights
    console.log(`[Analysis ${analysisId}] Generating AI insights...`);
    const updatedAnalysis = await db.getAnalysisById(analysisId);
    const savedCompetitors = await db.getCompetitorsByAnalysisId(analysisId);

    const aiInsights = await generateAIInsights(updatedAnalysis!, savedCompetitors);
    await db.updateAnalysis(analysisId, {
      overallAnalysis: aiInsights.overallAnalysis,
      strengths: aiInsights.strengths,
      weaknesses: aiInsights.weaknesses,
      opportunities: aiInsights.opportunities,
      recommendations: aiInsights.recommendations,
      industry: aiInsights.detectedIndustry || analysis.industry,
    });

    // Step 6: Generate content (blog post and ad copy)
    console.log(`[Analysis ${analysisId}] Generating content...`);
    const finalAnalysis = await db.getAnalysisById(analysisId);
    const contentResult = await generateContent(finalAnalysis!, savedCompetitors, "all");

    await db.updateAnalysis(analysisId, {
      generatedBlogPost: contentResult.blogPost,
      generatedAdCopy: contentResult.adCopy,
      status: "completed",
      completedAt: new Date(),
    });

    console.log(`[Analysis ${analysisId}] Competitive analysis completed successfully`);

  } catch (error) {
    console.error(`[Analysis ${analysisId}] Error:`, error);
    await db.updateAnalysis(analysisId, { status: "failed" });
    throw error;
  }
}

function calculateCompetitiveScore(competitor: any, targetSeo: any): number {
  let score = 50; // Base score

  // SEO score comparison
  if (competitor.seoScore) {
    score += Math.min(competitor.seoScore / 2, 25);
  }

  // Google rating impact
  if (competitor.googleRating) {
    const rating = parseFloat(competitor.googleRating);
    score += (rating - 3) * 10; // +/- 20 points based on rating
  }

  // Review count impact
  if (competitor.googleReviewCount) {
    score += Math.min(competitor.googleReviewCount / 10, 15);
  }

  // Website presence
  if (competitor.url) {
    score += 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getThreatLevel(score: number): "low" | "medium" | "high" {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}
