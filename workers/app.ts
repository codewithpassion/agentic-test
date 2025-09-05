/// <reference path="../worker-configuration.d.ts" />
import { Hono } from "hono";
import { cors } from "hono/cors";
import { type AppLoadContext, createRequestHandler } from "react-router";
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
