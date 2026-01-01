import { makeRequest } from "../_core/map";

interface DiscoveredCompetitor {
  name: string;
  placeId: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  types?: string[];
  location?: {
    lat: number;
    lng: number;
  };
}

/**
 * Discover competitors using Google Maps Places API
 */
export async function discoverCompetitors(
  businessName: string,
  location: string,
  industry?: string
): Promise<DiscoveredCompetitor[]> {
  try {
    // First, geocode the location to get coordinates
    const geocodeResult = await geocodeLocation(location);
    if (!geocodeResult) {
      console.warn(`Could not geocode location: ${location}`);
      return [];
    }

    // Build search query based on industry or business type
    const searchQuery = industry || extractIndustryFromName(businessName);

    // Search for nearby businesses
    console.log(`[CompetitorDiscovery] Searching for: "${searchQuery}" near ${geocodeResult.lat},${geocodeResult.lng}`);
    const competitors = await searchNearbyPlaces(
      geocodeResult.lat,
      geocodeResult.lng,
      searchQuery,
      businessName
    );

    console.log(`[CompetitorDiscovery] Found ${competitors.length} qualified competitors`);
    return competitors;
  } catch (error) {
    console.error("Error discovering competitors:", error);
    return [];
  }
}

async function geocodeLocation(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await makeRequest(
      `/maps/api/geocode/json?address=${encodeURIComponent(address)}`
    );

    const data = response as any;
    if (data.status === "OK" && data.results?.[0]?.geometry?.location) {
      return data.results[0].geometry.location;
    }
    console.warn(`[CompetitorDiscovery] Geocoding failed for "${address}":`, data.status);
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

async function searchNearbyPlaces(
  lat: number,
  lng: number,
  query: string,
  excludeBusinessName: string
): Promise<DiscoveredCompetitor[]> {
  try {
    // Use Places Text Search for better results
    const response = await makeRequest(
      `/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=10000`
    );

    const data = response as any;
    if (data.status !== "OK" || !data.results) {
      console.warn(`[CompetitorDiscovery] Text search failed or empty. Status: ${data.status}`);
      return [];
    }

    console.log(`[CompetitorDiscovery] Raw results found: ${data.results.length}`);
    const competitors: DiscoveredCompetitor[] = [];
    const excludeNameLower = excludeBusinessName.toLowerCase();

    for (const place of data.results) {
      // Skip the target business itself
      if (place.name.toLowerCase().includes(excludeNameLower) ||
        excludeNameLower.includes(place.name.toLowerCase())) {
        console.log(`[CompetitorDiscovery] Skipping self-match: ${place.name}`);
        continue;
      }

      // Skip large directories and chains that aren't real competitors
      if (isLargeDirectory(place.name)) {
        console.log(`[CompetitorDiscovery] Skipping directory: ${place.name}`);
        continue;
      }


      // Get place details for more info
      const details = await getPlaceDetails(place.place_id);

      competitors.push({
        name: place.name,
        placeId: place.place_id,
        address: place.formatted_address,
        rating: place.rating,
        reviewCount: place.user_ratings_total,
        types: place.types,
        location: place.geometry?.location,
        phone: details?.phone,
        website: details?.website,
      });

      // Limit to top 5 competitors
      if (competitors.length >= 5) {
        break;
      }
    }

    return competitors;
  } catch (error) {
    console.error("Places search error:", error);
    return [];
  }
}

async function getPlaceDetails(placeId: string): Promise<{ phone?: string; website?: string } | null> {
  try {
    const response = await makeRequest(
      `/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,website`
    );

    const data = response as any;
    if (data.status === "OK" && data.result) {
      return {
        phone: data.result.formatted_phone_number,
        website: data.result.website,
      };
    }
    return null;
  } catch (error) {
    console.error("Place details error:", error);
    return null;
  }
}

function extractIndustryFromName(businessName: string): string {
  // Common business type keywords
  const keywords = [
    "restaurant", "cafe", "coffee", "bakery", "pizza", "sushi",
    "salon", "spa", "barber", "beauty",
    "gym", "fitness", "yoga", "crossfit",
    "dental", "dentist", "clinic", "medical", "doctor",
    "law", "attorney", "legal",
    "accounting", "tax", "financial",
    "auto", "car", "mechanic", "repair",
    "plumber", "plumbing", "hvac", "electrical",
    "real estate", "realty", "property",
    "marketing", "agency", "design",
    "tech", "software", "it services",
    "media", "production", "video",
  ];

  const nameLower = businessName.toLowerCase();
  for (const keyword of keywords) {
    if (nameLower.includes(keyword)) {
      return keyword;
    }
  }

  // Default to general business search
  return "business";
}

function isLargeDirectory(name: string): boolean {
  const directories = [
    "yelp", "angi", "angie's list", "thumbtack", "homeadvisor",
    "yellowpages", "yellow pages", "bbb", "better business bureau",
    "google", "facebook", "linkedin", "instagram",
  ];

  const nameLower = name.toLowerCase();
  return directories.some(dir => nameLower.includes(dir));
}
