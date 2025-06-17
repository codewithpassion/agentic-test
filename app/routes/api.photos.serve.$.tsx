import type { LoaderFunctionArgs } from "react-router";

/**
 * API route for serving photos from R2 storage
 * GET /api/photos/serve/[key]
 */
export async function loader({ params, context }: LoaderFunctionArgs) {
	try {
		// Get the key from the splat parameter
		const key = params["*"];
		if (!key) {
			return new Response(JSON.stringify({ error: "File key is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Decode the key
		const decodedKey = decodeURIComponent(key);

		// Get file from R2
		const file = await context.cloudflare.env.PHOTO_STORAGE.get(decodedKey);
		if (!file) {
			return new Response(JSON.stringify({ error: "File not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
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
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Failed to serve photo",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
