import axios from "axios";

interface SEOAnalysisResult {
  score: number;
  metaTitle: string | null;
  metaDescription: string | null;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  wordCount: number;
  topKeywords: string[];
  issues: string[];
}

/**
 * Analyze SEO metrics for a given URL
 */
export async function analyzeSEO(url: string): Promise<SEOAnalysisResult> {
  const result: SEOAnalysisResult = {
    score: 0,
    metaTitle: null,
    metaDescription: null,
    headings: { h1: [], h2: [], h3: [] },
    wordCount: 0,
    topKeywords: [],
    issues: [],
  };

  try {
    // Ensure URL has protocol
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    
    // Fetch the page content
    const response = await axios.get(fullUrl, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PhoenixIntel/1.0; +https://phoenixintel.app)",
        "Accept": "text/html,application/xhtml+xml",
      },
      maxRedirects: 5,
    });

    const html = response.data;

    // Extract meta title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    result.metaTitle = titleMatch ? titleMatch[1].trim() : null;

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    result.metaDescription = descMatch ? descMatch[1].trim() : null;

    // Extract headings
    const h1Matches = html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi);
    const h2Matches = html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi);
    const h3Matches = html.matchAll(/<h3[^>]*>([^<]+)<\/h3>/gi);

    for (const match of h1Matches) result.headings.h1.push(cleanText(match[1]));
    for (const match of h2Matches) result.headings.h2.push(cleanText(match[1]));
    for (const match of h3Matches) result.headings.h3.push(cleanText(match[1]));

    // Extract and count words from body content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      const bodyText = stripHtml(bodyMatch[1]);
      const words = bodyText.split(/\s+/).filter((w: string) => w.length > 2);
      result.wordCount = words.length;

      // Extract top keywords
      result.topKeywords = extractTopKeywords(words);
    }

    // Calculate SEO score
    result.score = calculateSEOScore(result);

    // Identify issues
    result.issues = identifySEOIssues(result);

  } catch (error: any) {
    console.error(`SEO analysis error for ${url}:`, error.message);
    result.issues.push(`Could not fetch website: ${error.message}`);
    result.score = 0;
  }

  return result;
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTopKeywords(words: string[]): string[] {
  const stopWords = new Set([
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
    "her", "was", "one", "our", "out", "has", "have", "been", "would", "could",
    "their", "will", "when", "who", "get", "which", "make", "more", "some",
    "them", "than", "then", "what", "your", "with", "this", "that", "from",
    "they", "were", "said", "each", "she", "how", "about", "into", "just",
  ]);

  const wordCount: Record<string, number> = {};
  
  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
    if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
      wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
    }
  }

  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function calculateSEOScore(result: SEOAnalysisResult): number {
  let score = 0;

  // Title (20 points)
  if (result.metaTitle) {
    score += 10;
    if (result.metaTitle.length >= 30 && result.metaTitle.length <= 60) {
      score += 10;
    } else if (result.metaTitle.length > 0) {
      score += 5;
    }
  }

  // Meta description (20 points)
  if (result.metaDescription) {
    score += 10;
    if (result.metaDescription.length >= 120 && result.metaDescription.length <= 160) {
      score += 10;
    } else if (result.metaDescription.length > 0) {
      score += 5;
    }
  }

  // H1 heading (15 points)
  if (result.headings.h1.length === 1) {
    score += 15;
  } else if (result.headings.h1.length > 0) {
    score += 8;
  }

  // H2 headings (15 points)
  if (result.headings.h2.length >= 2) {
    score += 15;
  } else if (result.headings.h2.length > 0) {
    score += 8;
  }

  // Content length (20 points)
  if (result.wordCount >= 1000) {
    score += 20;
  } else if (result.wordCount >= 500) {
    score += 15;
  } else if (result.wordCount >= 300) {
    score += 10;
  } else if (result.wordCount > 0) {
    score += 5;
  }

  // Keywords diversity (10 points)
  if (result.topKeywords.length >= 8) {
    score += 10;
  } else if (result.topKeywords.length >= 5) {
    score += 7;
  } else if (result.topKeywords.length > 0) {
    score += 3;
  }

  return Math.min(100, score);
}

function identifySEOIssues(result: SEOAnalysisResult): string[] {
  const issues: string[] = [];

  if (!result.metaTitle) {
    issues.push("Missing meta title");
  } else if (result.metaTitle.length < 30) {
    issues.push("Meta title is too short (under 30 characters)");
  } else if (result.metaTitle.length > 60) {
    issues.push("Meta title is too long (over 60 characters)");
  }

  if (!result.metaDescription) {
    issues.push("Missing meta description");
  } else if (result.metaDescription.length < 120) {
    issues.push("Meta description is too short (under 120 characters)");
  } else if (result.metaDescription.length > 160) {
    issues.push("Meta description is too long (over 160 characters)");
  }

  if (result.headings.h1.length === 0) {
    issues.push("Missing H1 heading");
  } else if (result.headings.h1.length > 1) {
    issues.push("Multiple H1 headings (should have only one)");
  }

  if (result.headings.h2.length === 0) {
    issues.push("No H2 headings for content structure");
  }

  if (result.wordCount < 300) {
    issues.push("Content is too thin (under 300 words)");
  }

  return issues;
}
