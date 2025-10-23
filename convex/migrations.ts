import { internalMutation } from "./_generated/server";

export const addDefaultHoursToUsers = internalMutation({
	args: {},
	handler: async (ctx) => {
		const allUsers = await ctx.db.query("users").collect();

		let updatedCount = 0;
		for (const user of allUsers) {
			if (
				user.dailyMinHours === undefined ||
				user.dailyMaxHours === undefined
			) {
				await ctx.db.patch(user._id, {
					dailyMinHours: 8,
					dailyMaxHours: 8,
					updatedAt: Date.now(),
				});
				updatedCount++;
			}
		}

		return { updated: updatedCount, total: allUsers.length };
	},
});
