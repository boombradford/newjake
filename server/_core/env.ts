type AuthMode = "local";

function getAuthMode(): AuthMode {
  return "local";
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  authMode: getAuthMode(),
};

if (!ENV.cookieSecret || ENV.cookieSecret === "dev-secret-change-in-production") {
  if (ENV.isProduction) {
    throw new Error("JWT_SECRET must be set in production!");
  } else {
    console.warn("[ENV] WARNING: Using default JWT_SECRET for development");
  }
}
