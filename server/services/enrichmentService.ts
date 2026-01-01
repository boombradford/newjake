import axios from "axios";

interface EnrichmentResult {
  employeeCount?: string;
  fundingInfo?: string;
  techStack?: string[];
  recentNews?: Array<{
    title: string;
    url: string;
    date?: string;
    source?: string;
  }>;
}

/**
 * Enrich competitor data with external information
 * Uses free/public data sources where available
 */
export async function enrichCompetitorData(
  companyName: string,
  websiteUrl?: string | null
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    techStack: [],
    recentNews: [],
  };

  try {
    // Try to detect tech stack from website
    if (websiteUrl) {
      result.techStack = await detectTechStack(websiteUrl);
    }

    // Search for recent news mentions
    result.recentNews = await searchNewsArticles(companyName);

    // Estimate company size from various signals
    const sizeEstimate = await estimateCompanySize(companyName, websiteUrl);
    if (sizeEstimate) {
      result.employeeCount = sizeEstimate.employeeRange;
      result.fundingInfo = sizeEstimate.fundingInfo;
    }

  } catch (error) {
    console.error(`Enrichment error for ${companyName}:`, error);
  }

  return result;
}

/**
 * Detect technology stack from website
 */
async function detectTechStack(websiteUrl: string): Promise<string[]> {
  const techStack: string[] = [];

  try {
    const fullUrl = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
    
    const response = await axios.get(fullUrl, {
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PhoenixIntel/1.0)",
        "Accept": "text/html",
      },
      maxRedirects: 3,
    });

    const html = response.data.toLowerCase();
    const headers = response.headers;

    // Detect common technologies from HTML and headers
    const techSignatures: Record<string, string[]> = {
      "WordPress": ["wp-content", "wp-includes", "wordpress"],
      "Shopify": ["shopify", "cdn.shopify.com"],
      "Wix": ["wix.com", "wixstatic.com"],
      "Squarespace": ["squarespace", "sqsp"],
      "React": ["react", "_next", "reactdom"],
      "Vue.js": ["vue.js", "vuejs", "__vue__"],
      "Angular": ["ng-", "angular"],
      "jQuery": ["jquery"],
      "Bootstrap": ["bootstrap"],
      "Tailwind CSS": ["tailwind"],
      "Google Analytics": ["google-analytics", "gtag", "ga.js"],
      "Google Tag Manager": ["googletagmanager"],
      "Facebook Pixel": ["fbevents", "facebook.com/tr"],
      "HubSpot": ["hubspot", "hs-scripts"],
      "Mailchimp": ["mailchimp", "mc.js"],
      "Stripe": ["stripe.com", "stripe.js"],
      "PayPal": ["paypal"],
      "Cloudflare": ["cloudflare"],
    };

    for (const [tech, signatures] of Object.entries(techSignatures)) {
      for (const sig of signatures) {
        if (html.includes(sig)) {
          techStack.push(tech);
          break;
        }
      }
    }

    // Check headers for server info
    const serverHeader = headers["server"] || headers["x-powered-by"];
    if (serverHeader) {
      if (serverHeader.toLowerCase().includes("nginx")) techStack.push("Nginx");
      if (serverHeader.toLowerCase().includes("apache")) techStack.push("Apache");
      if (serverHeader.toLowerCase().includes("cloudflare")) techStack.push("Cloudflare");
    }

  } catch (error) {
    // Silently fail - tech detection is optional
  }

  return Array.from(new Set(techStack));
}

/**
 * Search for recent news articles about the company
 */
async function searchNewsArticles(companyName: string): Promise<EnrichmentResult["recentNews"]> {
  // Note: In production, you would integrate with a news API like NewsAPI, Google News API, or Bing News
  // For now, we return empty as we don't have API keys configured
  
  // This is a placeholder that could be enhanced with:
  // - NewsAPI.org (free tier available)
  // - Google Custom Search API
  // - Bing News Search API
  // - RSS feed aggregation
  
  return [];
}

/**
 * Estimate company size from available signals
 */
async function estimateCompanySize(
  companyName: string,
  websiteUrl?: string | null
): Promise<{ employeeRange?: string; fundingInfo?: string } | null> {
  // Note: In production, you would integrate with:
  // - LinkedIn Company API
  // - Crunchbase API
  // - PitchBook API
  // - Clearbit API
  
  // For now, we make educated guesses based on available signals
  
  try {
    if (!websiteUrl) {
      return { employeeRange: "1-10 (estimated)", fundingInfo: "Unknown" };
    }

    // Check if they have a careers page (indicates larger company)
    const fullUrl = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
    
    const response = await axios.get(fullUrl, {
      timeout: 5000,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PhoenixIntel/1.0)" },
    });

    const html = response.data.toLowerCase();
    
    // Look for signals of company size
    const hasCareersPage = html.includes("careers") || html.includes("jobs") || html.includes("hiring");
    const hasMultipleLocations = html.includes("locations") || html.includes("offices");
    const hasInvestors = html.includes("investors") || html.includes("backed by") || html.includes("funded");
    
    let employeeRange = "1-10";
    if (hasCareersPage && hasMultipleLocations) {
      employeeRange = "51-200";
    } else if (hasCareersPage) {
      employeeRange = "11-50";
    }

    let fundingInfo = "Bootstrapped/Unknown";
    if (hasInvestors) {
      fundingInfo = "Venture-backed (details unknown)";
    }

    return { employeeRange: `${employeeRange} (estimated)`, fundingInfo };

  } catch (error) {
    return null;
  }
}

/**
 * Get LinkedIn company data (placeholder for future integration)
 */
export async function getLinkedInData(companyName: string): Promise<{
  employeeCount?: number;
  industry?: string;
  founded?: string;
} | null> {
  // This would require LinkedIn API access
  // Placeholder for future integration
  return null;
}

/**
 * Get Crunchbase data (placeholder for future integration)
 */
export async function getCrunchbaseData(companyName: string): Promise<{
  funding?: string;
  investors?: string[];
  founded?: string;
} | null> {
  // This would require Crunchbase API access
  // Placeholder for future integration
  return null;
}
