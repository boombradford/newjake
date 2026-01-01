import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as crypto from "crypto";
import { promisify } from "util";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

const pbkdf2 = promisify(crypto.pbkdf2);

// Password hashing utilities for local auth
async function hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = await pbkdf2(password, salt, 100000, 64, "sha512");
    return `${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(
    password: string,
    storedHash: string
): Promise<boolean> {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const passwordHash = await pbkdf2(password, salt, 100000, 64, "sha512");
    return hash === passwordHash.toString("hex");
}

function getQueryParam(req: Request, key: string): string | undefined {
    const value = req.query[key];
    return typeof value === "string" ? value : undefined;
}

function getBodyParam(
    req: Request,
    key: string
): string | undefined {
    const value = req.body?.[key];
    return typeof value === "string" ? value : undefined;
}

export function registerAuthRoutes(app: Express) {
    // Manus OAuth callback route
    if (ENV.authMode === "manus") {
        app.get("/api/oauth/callback", async (req: Request, res: Response) => {
            const code = getQueryParam(req, "code");
            const state = getQueryParam(req, "state");

            if (!code || !state) {
                res.status(400).json({ error: "code and state are required" });
                return;
            }

            try {
                const tokenResponse = await sdk.exchangeCodeForToken(code, state);
                const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

                if (!userInfo.openId) {
                    res.status(400).json({ error: "openId missing from user info" });
                    return;
                }

                await db.upsertUser({
                    openId: userInfo.openId,
                    name: userInfo.name || null,
                    email: userInfo.email ?? null,
                    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
                    lastSignedIn: new Date(),
                });

                const sessionToken = await sdk.createSessionToken(userInfo.openId, {
                    name: userInfo.name || "",
                    expiresInMs: ONE_YEAR_MS,
                });

                const cookieOptions = getSessionCookieOptions(req);
                res.cookie(COOKIE_NAME, sessionToken, {
                    ...cookieOptions,
                    maxAge: ONE_YEAR_MS,
                });

                res.redirect(302, "/");
            } catch (error) {
                console.error("[OAuth] Callback failed", error);
                res.status(500).json({ error: "OAuth callback failed" });
            }
        });
    }

    // Local auth routes
    if (ENV.authMode === "local") {
        // Register endpoint
        app.post("/api/auth/register", async (req: Request, res: Response) => {
            const email = getBodyParam(req, "email");
            const password = getBodyParam(req, "password");
            const name = getBodyParam(req, "name");

            if (!email || !password) {
                res.status(400).json({ error: "Email and password are required" });
                return;
            }

            // Basic email validation
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                res.status(400).json({ error: "Invalid email format" });
                return;
            }

            // Password strength check
            if (password.length < 8) {
                res
                    .status(400)
                    .json({ error: "Password must be at least 8 characters" });
                return;
            }

            try {
                // Check if user already exists
                const existingUser = await db.getUserByEmail(email);
                if (existingUser) {
                    res.status(409).json({ error: "Email already registered" });
                    return;
                }

                // Create user with hashed password
                const passwordHash = await hashPassword(password);
                const openId = `local-${crypto.randomUUID()}`;

                await db.upsertUser({
                    openId,
                    email,
                    name: name || null,
                    passwordHash,
                    loginMethod: "local",
                    lastSignedIn: new Date(),
                });

                // Create session
                const sessionToken = await sdk.createSessionToken(openId, {
                    name: name || email,
                    expiresInMs: ONE_YEAR_MS,
                });

                const cookieOptions = getSessionCookieOptions(req);
                res.cookie(COOKIE_NAME, sessionToken, {
                    ...cookieOptions,
                    maxAge: ONE_YEAR_MS,
                });

                res.json({ success: true, message: "Registration successful" });
            } catch (error) {
                console.error("[Auth] Registration failed", error);
                res.status(500).json({ error: "Registration failed" });
            }
        });

        // Login endpoint
        app.post("/api/auth/login", async (req: Request, res: Response) => {
            const email = getBodyParam(req, "email");
            const password = getBodyParam(req, "password");

            if (!email || !password) {
                res.status(400).json({ error: "Email and password are required" });
                return;
            }

            try {
                // Get user by email
                const user = await db.getUserByEmail(email);
                if (!user || !user.passwordHash) {
                    res.status(401).json({ error: "Invalid email or password" });
                    return;
                }

                // Verify password
                const isValid = await verifyPassword(password, user.passwordHash);
                if (!isValid) {
                    res.status(401).json({ error: "Invalid email or password" });
                    return;
                }

                // Update last signed in
                await db.upsertUser({
                    openId: user.openId,
                    lastSignedIn: new Date(),
                });

                // Create session
                const sessionToken = await sdk.createSessionToken(user.openId, {
                    name: user.name || email,
                    expiresInMs: ONE_YEAR_MS,
                });

                const cookieOptions = getSessionCookieOptions(req);
                res.cookie(COOKIE_NAME, sessionToken, {
                    ...cookieOptions,
                    maxAge: ONE_YEAR_MS,
                });

                res.json({ success: true, message: "Login successful" });
            } catch (error) {
                console.error("[Auth] Login failed", error);
                res.status(500).json({ error: "Login failed" });
            }
        });
    }
}
