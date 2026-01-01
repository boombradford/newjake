export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Get auth mode from environment (defaults to local for dev)
export function getAuthMode(): "local" {
  return "local";
}

// Generate login URL at runtime
export const getLoginUrl = () => {
  return "/login";
};
