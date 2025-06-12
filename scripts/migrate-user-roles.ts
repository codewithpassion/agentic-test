import { eq, isNull } from "drizzle-orm";
import { createDbWithSchema } from "../api/database/db";
import { getCloudflareContext } from "../packages/better-auth/cloudflare";
import { user } from "../packages/better-auth/db/auth-schema";

/**
 * Migrate existing users to have default "user" role
 */
export async function migrateUserRoles() {
	console.log("Starting user role migration...");

	try {
		const context = getCloudflareContext();
		if (!context?.env.DB) {
			throw new Error("Database not available");
		}

		const db = createDbWithSchema(context.env.DB);

		// Update users with null roles to "user"
		const result = await db
			.update(user)
			.set({ role: "user" })
			.where(isNull(user.role));

		console.log(`Migrated ${result.changes} users to default role`);

		// Optionally promote specific users to admin
		await promoteInitialAdmins(db);

		console.log("User role migration completed successfully");
	} catch (error) {
		console.error("Error during user role migration:", error);
		throw error;
	}
}

/**
 * Promote initial admin users
 */
async function promoteInitialAdmins(db: ReturnType<typeof createDbWithSchema>) {
	const adminEmails = [
		"dominik@portcityai.com",
		// Add more admin emails here
	];

	for (const email of adminEmails) {
		try {
			const result = await db
				.update(user)
				.set({ role: "admin" })
				.where(eq(user.email, email));

			if (result.changes > 0) {
				console.log(`Promoted ${email} to admin`);
			} else {
				console.log(`User ${email} not found`);
			}
		} catch (error) {
			console.error(`Error promoting ${email}:`, error);
		}
	}
}

// Run migration if called directly
if (import.meta.main) {
	await migrateUserRoles();
}
