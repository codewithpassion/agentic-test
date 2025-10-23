import type { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";

/**
 * Seed worklog data for testing and development
 * Creates test users with different hour policies and 30 days of worklog data
 * Mix of overtime, undertime, and normal work patterns
 */
export const seedWorklogData = internalMutation({
	args: {},
	handler: async (ctx: MutationCtx) => {
		// Check if already seeded
		const existingWorklogs = await ctx.db.query("worklogs").first();
		if (existingWorklogs) {
			const count = await ctx.db.query("worklogs").collect();
			return {
				message: "Already seeded - worklogs exist",
				worklogsCount: count.length,
			};
		}

		console.log("Starting worklog seed...");

		// Test users with different hour policies
		const testUsers = [
			{
				clerkId: "user_test_parttime",
				email: "parttime@example.com",
				name: "Alice Cooper (Part-time)",
				dailyMinHours: 3,
				dailyMaxHours: 5,
				roles: ["user"],
			},
			{
				clerkId: "user_test_fulltime",
				email: "fulltime@example.com",
				name: "Bob Johnson (Full-time)",
				dailyMinHours: 7,
				dailyMaxHours: 9,
				roles: ["user"],
			},
			{
				clerkId: "user_test_standard",
				email: "standard@example.com",
				name: "Charlie Davis (Standard)",
				dailyMinHours: 8,
				dailyMaxHours: 8,
				roles: ["user"],
			},
			{
				clerkId: "admin_test",
				email: "admin@example.com",
				name: "Diana Admin",
				dailyMinHours: 8,
				dailyMaxHours: 8,
				roles: ["admin"],
			},
		];

		interface UserWithId {
			id: Id<"users">;
			name: string;
			dailyMinHours: number;
			dailyMaxHours: number;
		}

		const userIds: UserWithId[] = [];
		for (const userData of testUsers) {
			const existing = await ctx.db
				.query("users")
				.withIndex("by_clerkId", (q) => q.eq("clerkId", userData.clerkId))
				.unique();

			if (existing) {
				// Update existing user to ensure correct hours
				await ctx.db.patch(existing._id, {
					dailyMinHours: userData.dailyMinHours,
					dailyMaxHours: userData.dailyMaxHours,
					roles: userData.roles,
					updatedAt: Date.now(),
				});
				userIds.push({
					id: existing._id,
					name: userData.name,
					dailyMinHours: userData.dailyMinHours,
					dailyMaxHours: userData.dailyMaxHours,
				});
				console.log(`Updated existing user: ${userData.email}`);
			} else {
				const userId = await ctx.db.insert("users", {
					...userData,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				});
				userIds.push({
					id: userId,
					name: userData.name,
					dailyMinHours: userData.dailyMinHours,
					dailyMaxHours: userData.dailyMaxHours,
				});
				console.log(`Created new user: ${userData.email}`);
			}
		}

		// Generate 30 days of worklogs
		const today = new Date();
		let totalWorklogs = 0;

		for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
			const date = new Date(today);
			date.setDate(date.getDate() - dayOffset);
			const dateStr = date.toISOString().split("T")[0];

			for (const user of userIds) {
				// Skip admin occasionally (admins work less in test data)
				if (user.name.includes("Admin") && Math.random() < 0.3) {
					continue;
				}

				// Vary number of entries per day (0-4 entries, mostly 2-3)
				const rand = Math.random();
				let numEntries: number;
				if (rand < 0.1) {
					numEntries = 0; // 10% days off
				} else if (rand < 0.3) {
					numEntries = 1; // 20% single entry
				} else if (rand < 0.7) {
					numEntries = 2; // 40% two entries
				} else if (rand < 0.9) {
					numEntries = 3; // 20% three entries
				} else {
					numEntries = 4; // 10% four entries
				}

				if (numEntries === 0) continue;

				// Determine total hours for the day to create OT/UT/Normal mix
				let dayTotalHours: number;
				const statusRand = Math.random();

				if (statusRand < 0.2) {
					// 20% undertime (below min)
					dayTotalHours = user.dailyMinHours * (0.5 + Math.random() * 0.4);
				} else if (statusRand < 0.4) {
					// 20% overtime (above max)
					dayTotalHours = user.dailyMaxHours * (1.1 + Math.random() * 0.5);
				} else {
					// 60% normal (within range)
					dayTotalHours =
						user.dailyMinHours +
						Math.random() * (user.dailyMaxHours - user.dailyMinHours);
				}

				// Split total hours across entries
				const entryHours: number[] = [];
				let remaining = dayTotalHours;

				for (let i = 0; i < numEntries - 1; i++) {
					const portion = remaining * (0.2 + Math.random() * 0.4);
					entryHours.push(portion);
					remaining -= portion;
				}
				entryHours.push(remaining); // Last entry gets remaining hours

				// Create worklog entries
				for (let i = 0; i < numEntries; i++) {
					const hours = Math.round(entryHours[i] * 10) / 10; // Round to 1 decimal

					// Vary task IDs and descriptions
					const taskId =
						Math.random() > 0.3
							? `TASK-${Math.floor(Math.random() * 500)}`
							: undefined;

					const descriptions = [
						"Working on feature implementation",
						"Bug fixes and code review",
						"Team meetings and planning",
						"Documentation updates",
						"Testing and QA",
						"Client communication",
						"Research and learning",
						"Code refactoring",
					];
					const description =
						Math.random() > 0.2
							? descriptions[Math.floor(Math.random() * descriptions.length)]
							: undefined;

					// Stagger creation times throughout the day
					const createdTime = new Date(date);
					createdTime.setHours(9 + i * 2); // Entries at 9am, 11am, 1pm, 3pm
					createdTime.setMinutes(Math.floor(Math.random() * 60));

					await ctx.db.insert("worklogs", {
						userId: user.id,
						date: dateStr,
						workedHours: hours,
						taskId,
						description,
						createdAt: createdTime.getTime(),
						updatedAt: createdTime.getTime(),
					});

					totalWorklogs++;
				}
			}
		}

		console.log(`Seed completed: ${totalWorklogs} worklogs created`);

		return {
			message: "Seed completed successfully",
			usersCreated: userIds.length,
			worklogsCreated: totalWorklogs,
			users: userIds.map((u) => ({
				name: u.name,
				minHours: u.dailyMinHours,
				maxHours: u.dailyMaxHours,
			})),
		};
	},
});

/**
 * Clear all worklog data (use with caution!)
 * Useful for re-seeding during development
 */
export const clearWorklogData = internalMutation({
	args: {},
	handler: async (ctx: MutationCtx) => {
		const worklogs = await ctx.db.query("worklogs").collect();

		for (const worklog of worklogs) {
			await ctx.db.delete(worklog._id);
		}

		return {
			message: "All worklogs cleared",
			deletedCount: worklogs.length,
		};
	},
});

/**
 * Add default hours to existing users who don't have them
 * Migration function for existing production users
 */
export const addDefaultHoursToUsers = internalMutation({
	args: {},
	handler: async (ctx: MutationCtx) => {
		const allUsers = await ctx.db.query("users").collect();
		let updatedCount = 0;

		for (const user of allUsers) {
			// Skip test users (they should have correct values)
			if (user.email.includes("@example.com")) {
				continue;
			}

			// Note: TypeScript will catch if fields are truly missing in schema
			// This check is for runtime safety during migration
			const needsUpdate =
				typeof user.dailyMinHours !== "number" ||
				typeof user.dailyMaxHours !== "number";

			if (needsUpdate) {
				await ctx.db.patch(user._id, {
					dailyMinHours: 8, // Default: 8 hours
					dailyMaxHours: 8,
					updatedAt: Date.now(),
				});
				updatedCount++;
			}
		}

		return {
			message: "Migration completed",
			totalUsers: allUsers.length,
			updatedUsers: updatedCount,
		};
	},
});
