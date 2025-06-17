import { Hono } from "hono";
import { generateId } from "../../api/lib/utils";
import { PhotoFileStore } from "../../api/services/photo-file-store";
import type { CloudflareBindings } from "../types";

/**
 * Photo Upload Routes
 * Handles direct photo uploads to R2 storage
 */
export const photoUploadRoutes = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * POST /api/upload
 * Upload photo directly to R2 storage
 */
photoUploadRoutes.post("/", async (c) => {
	try {
		// Parse form data
		const formData = await c.req.formData();
		const file = formData.get("file") as File;
		const competitionId = formData.get("competitionId") as string;
		const categoryId = formData.get("categoryId") as string;
		const userId = formData.get("userId") as string;

		// Validate required fields
		if (!file || !competitionId || !categoryId || !userId) {
			return c.json(
				{
					error:
						"Missing required fields: file, competitionId, categoryId, userId",
				},
				400,
			);
		}

		// Validate file type
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
		if (!allowedTypes.includes(file.type)) {
			return c.json(
				{
					error: "Invalid file type. Only JPEG and PNG files are allowed.",
				},
				400,
			);
		}

		// Validate file size (10MB max)
		const maxSize = 10 * 1024 * 1024;
		if (file.size > maxSize) {
			return c.json(
				{
					error: "File too large. Maximum size is 10MB.",
				},
				400,
			);
		}

		// Generate photo ID
		const photoId = generateId();

		// Create PhotoFileStore instance
		const photoStore = new PhotoFileStore(c.env.PHOTO_STORAGE);

		// Upload to R2
		const uploadedFile = await photoStore.create({
			id: photoId,
			name: file.name,
			type: file.type,
			content: file,
			competitionId,
			categoryId,
			userId,
		});

		// Return success response
		return c.json({
			success: true,
			file: {
				id: uploadedFile.id,
				name: uploadedFile.name,
				type: uploadedFile.type,
				key: uploadedFile.key,
				url: photoStore.getPublicUrl(uploadedFile),
			},
		});
	} catch (error) {
		console.error("Photo upload error:", error);
		return c.json(
			{
				error: error instanceof Error ? error.message : "Upload failed",
			},
			500,
		);
	}
});

/**
 * GET /api/photos/serve/:key
 * Serve photo directly from R2
 */
photoUploadRoutes.get("/photos/serve/:key", async (c) => {
	try {
		const key = decodeURIComponent(c.req.param("key"));
		const photoStore = new PhotoFileStore(c.env.PHOTO_STORAGE);

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
