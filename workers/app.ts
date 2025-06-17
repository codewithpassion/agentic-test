import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
/// <reference path="../worker-configuration.d.ts" />
import { Hono } from "hono";
import { cors } from "hono/cors";
import { cloudflareContextMiddleware } from "packages/better-auth";
import { type AppLoadContext, createRequestHandler } from "react-router";
import { authFactory } from "~~/auth";
import { appRouter } from "../api/trpc";
import { createContext } from "../api/trpc/context";
import { D1DbMiddleware } from "./middleware";
import { photoUploadRoutes } from "./routes/photo-upload";
import type { AppType } from "./types";

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: CloudflareEnvironment;
			var: CloudflareVariables;
			ctx: ExecutionContext;
		};
	}
}

const requestHandler = createRequestHandler(
	// @ts-ignore
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

const app = new Hono<AppType>();

app.use(cloudflareContextMiddleware);
app.use(D1DbMiddleware);

// CORS configuration for API routes
app.use(
	"/api/*",
	cors({
		origin: (origin) => {
			// Allow all origins in development
			if (import.meta.env.DEV) return origin || "*";

			// Configure allowed origins for production
			const allowedOrigins = [
				"https://your-domain.com",
				"https://www.your-domain.com",
			];

			return allowedOrigins.includes(origin || "") ? origin : "";
		},
		credentials: true,
	}),
);

app.get("/api/health", (c) => {
	return c.json({ status: "ok" });
});

app.get("/api/seed", async (c) => {
	await c.var.Database.seed();
	return c.json({ status: "ok" });
});

// tRPC handler
app.all("/api/trpc/*", async (c) => {
	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req: c.req.raw,
		router: appRouter,
		createContext: (opts) => createContext({ ...opts, env: c.env }),
		onError: ({ error, path }) => {
			console.error(`tRPC Error on path '${path}':`, error);
		},
	});
});

// Photo upload routes
app.route("/api", photoUploadRoutes);

// Authentication routes
app.on(["POST", "GET"], "/api/auth/*", async (c) => {
	return (await authFactory(c.env, c.req.raw)).handler(c.req.raw);
});

app.use(async (c) => {
	const reactRouterContext = {
		cloudflare: {
			env: c.env,
			var: c.var,
			ctx: c.executionCtx,
		},
	} as unknown as AppLoadContext;
	return requestHandler(c.req.raw, reactRouterContext);
});

export default {
	fetch: app.fetch,
} satisfies ExportedHandler<CloudflareEnvironment>;
