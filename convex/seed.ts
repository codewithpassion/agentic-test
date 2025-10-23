import type { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";

export const seedWorklogData = internalMutation({
	args: {},
	handler: async (ctx) => {
		// Check if already seeded
		const existingWorklogs = await ctx.db.query("worklogs").first();
		if (existingWorklogs) {
			return { message: "Already seeded" };
		}

		// Create test users
		const testUsers = [
			{
				clerkId: "user_test1",
				email: "user1@example.com",
				name: "Test User 1",
				dailyMinHours: 3,
				dailyMaxHours: 5,
				roles: ["user"],
			},
			{
				clerkId: "user_test2",
				email: "user2@example.com",
				name: "Test User 2",
				dailyMinHours: 7,
				dailyMaxHours: 9,
				roles: ["user"],
			},
			{
				clerkId: "admin_test",
				email: "admin@example.com",
				name: "Admin User",
				dailyMinHours: 8,
				dailyMaxHours: 8,
				roles: ["admin"],
			},
		];

		interface UserWithId {
			id: Id<"users">;
			clerkId: string;
			email: string;
			name: string;
			dailyMinHours: number;
			dailyMaxHours: number;
			roles: string[];
		}

		const userIds: UserWithId[] = [];
		for (const userData of testUsers) {
			const existing = await ctx.db
				.query("users")
				.withIndex("by_clerkId", (q) => q.eq("clerkId", userData.clerkId))
				.unique();

			if (!existing) {
				const userId = await ctx.db.insert("users", {
					...userData,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				});
				userIds.push({ id: userId, ...userData });
			} else {
				userIds.push({ id: existing._id, ...userData });
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
				// 0-4 entries per day (mostly 2-3)
				const numEntries =
					Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 3) + 2;

				for (let i = 0; i < numEntries; i++) {
					// Generate hours that create OT/UT/normal mix
					let hours: number;
					const rand = Math.random();

					if (rand < 0.2) {
						// 20% undertime
						hours = user.dailyMinHours * (0.5 + Math.random() * 0.4);
					} else if (rand < 0.4) {
						// 20% overtime
						hours = user.dailyMaxHours * (1.1 + Math.random() * 0.4);
					} else {
						// 60% normal
						hours =
							user.dailyMinHours +
							Math.random() * (user.dailyMaxHours - user.dailyMinHours);
					}

					const entryHours = hours / numEntries;

					await ctx.db.insert("worklogs", {
						userId: user.id,
						date: dateStr,
						workedHours: Math.round(entryHours * 10) / 10,
						taskId:
							Math.random() > 0.5
								? `TASK-${Math.floor(Math.random() * 1000)}`
								: undefined,
						description:
							Math.random() > 0.3
								? `Work on project ${["A", "B", "C"][Math.floor(Math.random() * 3)]}`
								: undefined,
						createdAt: date.getTime(),
						updatedAt: date.getTime(),
					});

					totalWorklogs++;
				}
			}
		}

		return {
			message: "Seed completed",
			usersCreated: userIds.length,
			worklogsCreated: totalWorklogs,
		};
	},
});
