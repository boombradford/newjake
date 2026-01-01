/**
 * Google Maps API Integration
 * 
 * Supports two modes:
 * 1. Manus Forge Proxy (if BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY are set)
 * 2. Direct Google Maps API (if GOOGLE_MAPS_API_KEY is set)
 * 3. Mock mode (if neither is set, returns mock data for development)
 */

import { ENV } from "./env";

// ============================================================================
// Configuration
// ============================================================================

type MapsMode = "proxy" | "direct" | "mock";

type MapsConfig = {
  mode: MapsMode;
  apiKey?: string;
  baseUrl?: string;
};

function getMapsConfig(): MapsConfig {
  // Check for Manus Forge proxy credentials
  if (ENV.forgeApiUrl && ENV.forgeApiKey) {
    return {
      mode: "proxy",
      baseUrl: ENV.forgeApiUrl.replace(/\/+$/, ""),
      apiKey: ENV.forgeApiKey,
    };
  }

  // Check for direct Google Maps API key
  if (ENV.googleMapsApiKey) {
    return {
      mode: "direct",
      apiKey: ENV.googleMapsApiKey,
    };
  }

  // Fallback to mock mode for development
  console.warn(
    "[Maps API] No credentials configured. Using mock mode. Set GOOGLE_MAPS_API_KEY or BUILT_IN_FORGE_API_* to enable real data."
  );
  return {
    mode: "mock",
  };
}

// ============================================================================
// Core Request Handler
// ============================================================================

interface RequestOptions {
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
}

/**
 * Make requests to Google Maps APIs
 * Automatically handles proxy, direct, or mock modes based on configuration
 */
export async function makeRequest<T = unknown>(
  endpoint: string,
  params: Record<string, unknown> = {},
  options: RequestOptions = {}
): Promise<T> {
  const config = getMapsConfig();

  if (config.mode === "mock") {
    return getMockResponse<T>(endpoint, params);
  }

  let url: URL;

  if (config.mode === "proxy") {
    // Use Manus Forge proxy
    url = new URL(`${config.baseUrl}/v1/maps/proxy${endpoint}`);
  } else {
    // Use direct Google Maps API
    url = new URL(`https://maps.googleapis.com${endpoint}`);
  }

  // Add API key
  if (config.apiKey) {
    url.searchParams.append("key", config.apiKey);
  }

  // Add other query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  try {
    const response = await fetch(url.toString(), {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Google Maps API request failed (${response.status} ${response.statusText}): ${errorText}`
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`[Maps API] Request failed for ${endpoint}:`, error);
    throw error;
  }
}

// ============================================================================
// Mock Data for Development
// ============================================================================

function getMockResponse<T>(
  endpoint: string,
  params: Record<string, unknown>
): T {
  console.log(`[Maps API Mock] ${endpoint}`, params);

  // Geocoding
  if (endpoint.includes("/geocode/json")) {
    return {
      status: "OK",
      results: [
        {
          geometry: {
            location: { lat: 37.7749, lng: -122.4194 }, // San Francisco
          },
          formatted_address: params.address || "San Francisco, CA, USA",
        },
      ],
    } as T;
  }

  // Place search
  if (endpoint.includes("/place/textsearch/json") || endpoint.includes("/place/findplacefromtext/json")) {
    return {
      status: "OK",
      candidates: [
        {
          place_id: "mock-place-123",
          name: "Sample Business",
          rating: 4.5,
          user_ratings_total: 150,
          formatted_address: "123 Main St, City, State",
        },
      ],
      results: [
        {
          place_id: "mock-competitor-1",
          name: "Competitor A",
          rating: 4.2,
          user_ratings_total: 89,
          formatted_address: "456 Oak Ave",
          types: ["business"],
          geometry: {
            location: { lat: 37.7749, lng: -122.4194 },
          },
        },
        {
          place_id: "mock-competitor-2",
          name: "Competitor B",
          rating: 4.7,
          user_ratings_total: 210,
          formatted_address: "789 Pine St",
          types: ["business"],
          geometry: {
            location: { lat: 37.7849, lng: -122.4094 },
          },
        },
      ],
    } as T;
  }

  // Place details
  if (endpoint.includes("/place/details/json")) {
    return {
      status: "OK",
      result: {
        name: "Mock Business",
        formatted_phone_number: "(555) 123-4567",
        website: "https://example.com",
        rating: 4.5,
        user_ratings_total: 123,
        opening_hours: {
          weekday_text: [
            "Monday: 9:00 AM – 5:00 PM",
            "Tuesday: 9:00 AM – 5:00 PM",
            "Wednesday: 9:00 AM – 5:00 PM",
            "Thursday: 9:00 AM – 5:00 PM",
            "Friday: 9:00 AM – 5:00 PM",
            "Saturday: Closed",
            "Sunday: Closed",
          ],
        },
      },
    } as T;
  }

  // Default empty response
  return { status: "MOCK", results: [] } as T;
}

// ============================================================================
// Type Definitions (kept from original)
// ============================================================================

export type TravelMode = "driving" | "walking" | "bicycling" | "transit";
export type MapType = "roadmap" | "satellite" | "terrain" | "hybrid";
export type SpeedUnit = "KPH" | "MPH";

export type LatLng = {
  lat: number;
  lng: number;
};

export type GeocodingResult = {
  results: Array<{
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    formatted_address: string;
    geometry: {
      location: LatLng;
      location_type: string;
      viewport: {
        northeast: LatLng;
        southwest: LatLng;
      };
    };
    place_id: string;
    types: string[];
  }>;
  status: string;
};

export type PlacesSearchResult = {
  results: Array<{
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: LatLng;
    };
    rating?: number;
    user_ratings_total?: number;
    business_status?: string;
    types: string[];
  }>;
  status: string;
};

export type PlaceDetailsResult = {
  result: {
    place_id: string;
    name: string;
    formatted_address: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    rating?: number;
    user_ratings_total?: number;
    reviews?: Array<{
      author_name: string;
      rating: number;
      text: string;
      time: number;
    }>;
    opening_hours?: {
      open_now: boolean;
      weekday_text: string[];
    };
    geometry: {
      location: LatLng;
    };
  };
  status: string;
};
