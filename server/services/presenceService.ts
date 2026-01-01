import { makeRequest } from "../_core/map";
import axios from "axios";

interface OnlinePresenceResult {
  hasGoogleBusiness: boolean;
  googleRating: number | null;
  reviewCount: number | null;
  socialProfiles: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  businessHours?: string;
  photos?: number;
  types?: string[];
  primaryType?: string;
}

/**
 * Analyze online presence for a business
 */
export async function analyzeOnlinePresence(
  businessName: string,
  location: string
): Promise<OnlinePresenceResult> {
  const result: OnlinePresenceResult = {
    hasGoogleBusiness: false,
    googleRating: null,
    reviewCount: null,
    socialProfiles: {},
  };

  try {
    // Search for the business on Google Places
    const searchQuery = `${businessName} ${location}`;
    const placesResponse = await makeRequest(
      `/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name,rating,user_ratings_total,formatted_address,photos,types`
    );

    const placesData = placesResponse as any;

    if (placesData.status === "OK" && placesData.candidates?.[0]) {
      const place = placesData.candidates[0];
      result.hasGoogleBusiness = true;
      result.googleRating = place.rating || null;
      result.reviewCount = place.user_ratings_total || null;
      result.photos = place.photos?.length || 0;
      result.types = place.types || [];
      result.primaryType = place.types?.[0]?.replace(/_/g, " ") || undefined;

      // Get more details if we have a place_id
      if (place.place_id) {
        const detailsResponse = await makeRequest(
          `/maps/api/place/details/json?place_id=${place.place_id}&fields=website,opening_hours,url`
        );

        const detailsData = detailsResponse as any;
        if (detailsData.status === "OK" && detailsData.result) {
          result.businessHours = detailsData.result.opening_hours?.weekday_text?.join(", ");

          // If we have a website, try to find social links
          if (detailsData.result.website) {
            const socialLinks = await findSocialLinks(detailsData.result.website);
            result.socialProfiles = socialLinks;
          }
        }
      }
    }

  } catch (error) {
    console.error("Online presence analysis error:", error);
  }

  return result;
}

/**
 * Find social media links from a website
 */
async function findSocialLinks(websiteUrl: string): Promise<OnlinePresenceResult["socialProfiles"]> {
  const socialProfiles: OnlinePresenceResult["socialProfiles"] = {};

  try {
    const response = await axios.get(websiteUrl, {
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PhoenixIntel/1.0)",
        "Accept": "text/html",
      },
      maxRedirects: 3,
    });

    const html = response.data;

    // Find social media links
    const socialPatterns = {
      facebook: /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/gi,
      twitter: /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+/gi,
      instagram: /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._]+/gi,
      linkedin: /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9-]+/gi,
      youtube: /https?:\/\/(?:www\.)?youtube\.com\/(?:channel|c|user)\/[a-zA-Z0-9_-]+/gi,
    };

    for (const [platform, pattern] of Object.entries(socialPatterns)) {
      const matches = html.match(pattern);
      if (matches && matches[0]) {
        socialProfiles[platform as keyof typeof socialProfiles] = matches[0];
      }
    }

  } catch (error) {
    // Silently fail - social links are optional
  }

  return socialProfiles;
}

/**
 * Get review summary from Google Places
 */
export async function getReviewSummary(placeId: string): Promise<{
  rating: number;
  totalReviews: number;
  recentReviews: Array<{ text: string; rating: number; time: string }>;
}> {
  try {
    const response = await makeRequest(
      `/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,reviews`
    );

    const data = response as any;
    if (data.status === "OK" && data.result) {
      return {
        rating: data.result.rating || 0,
        totalReviews: data.result.user_ratings_total || 0,
        recentReviews: (data.result.reviews || []).slice(0, 5).map((r: any) => ({
          text: r.text,
          rating: r.rating,
          time: r.relative_time_description,
        })),
      };
    }
  } catch (error) {
    console.error("Review summary error:", error);
  }

  return { rating: 0, totalReviews: 0, recentReviews: [] };
}
