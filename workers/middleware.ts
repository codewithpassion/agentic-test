import { drizzle } from "drizzle-orm/d1";
import { createMiddleware } from "hono/factory";
import type { AppType } from "./types";

const D1DbMiddleware = createMiddleware<AppType>(async (c, next) => {
	const db = drizzle(c.env.DB);

	c.set("Database", {
		client: db,
		seed: async () => {
			// Seeding is no longer needed with Clerk
			// Users are managed externally
			console.log("Database seeding skipped - users managed by Clerk");
		},
	});

	await next();
});

export { D1DbMiddleware };
