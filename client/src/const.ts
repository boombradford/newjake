export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Get auth mode from environment (defaults to local for dev)
export function getAuthMode(): "manus" | "local" {
  const mode = import.meta.env.VITE_AUTH_MODE?.toLowerCase();
  if (mode === "local" || mode === "manus") return mode;
  // Default to local for development
  return import.meta.env.MODE === "production" ? "manus" : "local";
}

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const authMode = getAuthMode();

  // For local auth, return login page route
  if (authMode === "local") {
    return "/login";
  }

  // For Manus OAuth, generate OAuth redirect URL
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
