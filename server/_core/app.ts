import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./auth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { apiRateLimiter, authRateLimiter } from "./rateLimiter";

export function createApp() {
    const app = express();

    // Trust proxy for accurate IP addresses (important for Vercel)
    app.set('trust proxy', 1);

    // Configure body parser with larger size limit for file uploads
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));

    // Apply rate limiting to authentication routes
    app.use("/api/oauth", authRateLimiter);

    // OAuth callback under /api/oauth/callback
    registerAuthRoutes(app);

    // Apply API rate limiting to tRPC endpoints
    // Doubled capacity: 100 requests/minute with smart skipping of successful requests
    app.use("/api/trpc", apiRateLimiter);

    // tRPC API
    app.use(
        "/api/trpc",
        createExpressMiddleware({
            router: appRouter,
            createContext,
        })
    );

    return app;
}

export const app = createApp();
