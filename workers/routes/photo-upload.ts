import { Hono } from "hono";
import { generateId } from "../../api/lib/utils";
import { PhotoFileStore } from "../lib/photo-file-store";
import type { CloudflareBindings } from "../types";

/**
 * Photo Upload Routes
 * Handles direct photo uploads to R2 storage
 */
export const photoUploadRoutes = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * GET /api/photos/serve/:key
 * Serve photo directly from R2
 */
photoUploadRoutes.get("/photos/serve/:key", async (c) => {
	try {
		const key = decodeURIComponent(c.req.param("key"));

		// Get file from R2
		const file = await c.env.PHOTO_STORAGE.get(key);
		if (!file) {
			return c.json({ error: "File not found" }, 404);
		}

		// Set appropriate headers
		const headers = new Headers();
		headers.set("Content-Type", file.httpMetadata?.contentType || "image/jpeg");
		headers.set("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
		headers.set("Access-Control-Allow-Origin", "*");

		// Return file stream
		return new Response(file.body, { headers });
	} catch (error) {
		console.error("Serve photo error:", error);
		return c.json(
			{
				error: error instanceof Error ? error.message : "Failed to serve photo",
			},
			500,
		);
	}
});
