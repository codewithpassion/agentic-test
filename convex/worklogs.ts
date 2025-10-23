import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// Get worklogs for current user
export const getMyWorklogs = query({
	args: {
		startDate: v.optional(v.string()),
		endDate: v.optional(v.string()),
	},
	handler: async (ctx: QueryCtx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
			.unique();

		if (!user) {
			throw new ConvexError("User not found");
		}

		const query_obj = ctx.db
			.query("worklogs")
			.withIndex("by_user_date", (q) => q.eq("userId", user._id));

		const worklogs = await query_obj.collect();

		// Filter by date range if provided
		const { startDate, endDate } = args;
		let filtered = worklogs;
		if (startDate !== undefined) {
			filtered = filtered.filter((w) => w.date >= startDate);
		}
		if (endDate !== undefined) {
			filtered = filtered.filter((w) => w.date <= endDate);
		}

		// Sort by date descending
		filtered.sort((a, b) => b.date.localeCompare(a.date));

		return filtered;
	},
});

// Get worklogs for a specific user (admin only)
export const getUserWorklogs = query({
	args: {
		userId: v.string(),
		startDate: v.optional(v.string()),
		endDate: v.optional(v.string()),
	},
	handler: async (ctx: QueryCtx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		const currentUser = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
			.unique();

		if (!currentUser || !currentUser.roles?.includes("admin")) {
			throw new ConvexError("Unauthorized: Admin access required");
		}

		// Get the target user by clerkId
		const targetUser = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
			.unique();

		if (!targetUser) {
			throw new ConvexError("User not found");
		}

		const worklogs = await ctx.db
			.query("worklogs")
			.withIndex("by_user_date", (q) => q.eq("userId", targetUser._id))
			.collect();

		// Filter by date range if provided
		const { startDate, endDate } = args;
		let filtered = worklogs;
		if (startDate !== undefined) {
			filtered = filtered.filter((w) => w.date >= startDate);
		}
		if (endDate !== undefined) {
			filtered = filtered.filter((w) => w.date <= endDate);
		}

		// Sort by date descending
		filtered.sort((a, b) => b.date.localeCompare(a.date));

		return filtered;
	},
});

// Get all worklogs for a date (admin only)
export const getWorklogsForDate = query({
	args: {
		date: v.string(),
	},
	handler: async (ctx: QueryCtx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		const currentUser = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
			.unique();

		if (!currentUser || !currentUser.roles?.includes("admin")) {
			throw new ConvexError("Unauthorized: Admin access required");
		}

		const worklogs = await ctx.db
			.query("worklogs")
			.withIndex("by_date_user", (q) => q.eq("date", args.date))
			.collect();

		return worklogs;
	},
});

// Create a new worklog
export const createWorklog = mutation({
	args: {
		date: v.string(),
		workedHours: v.number(),
		taskId: v.optional(v.string()),
		description: v.optional(v.string()),
	},
	handler: async (
		ctx: MutationCtx,
		{ date, workedHours, taskId, description },
	) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
			.unique();

		if (!user) {
			throw new ConvexError("User not found");
		}

		// Validate date format (YYYY-MM-DD)
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			throw new ConvexError("Invalid date format. Use YYYY-MM-DD");
		}

		// Validate hours
		if (workedHours <= 0) {
			throw new ConvexError("Worked hours must be greater than 0");
		}

		const worklogId = await ctx.db.insert("worklogs", {
			userId: user._id,
			date,
			workedHours,
			taskId,
			description,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return worklogId;
	},
});

// Update a worklog
export const updateWorklog = mutation({
	args: {
		worklogId: v.id("worklogs"),
		workedHours: v.optional(v.number()),
		taskId: v.optional(v.string()),
		description: v.optional(v.string()),
	},
	handler: async (ctx: MutationCtx, { worklogId, ...updates }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
			.unique();

		if (!user) {
			throw new ConvexError("User not found");
		}

		const worklog = await ctx.db.get(worklogId);
		if (!worklog) {
			throw new ConvexError("Worklog not found");
		}

		// Check ownership or admin access
		if (worklog.userId !== user._id && !user.roles?.includes("admin")) {
			throw new ConvexError("Unauthorized");
		}

		// Validate hours if provided
		if (updates.workedHours !== undefined && updates.workedHours <= 0) {
			throw new ConvexError("Worked hours must be greater than 0");
		}

		await ctx.db.patch(worklogId, {
			...updates,
			updatedAt: Date.now(),
		});

		return worklogId;
	},
});

// Delete a worklog
export const deleteWorklog = mutation({
	args: {
		worklogId: v.id("worklogs"),
	},
	handler: async (ctx: MutationCtx, { worklogId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
			.unique();

		if (!user) {
			throw new ConvexError("User not found");
		}

		const worklog = await ctx.db.get(worklogId);
		if (!worklog) {
			throw new ConvexError("Worklog not found");
		}

		// Check ownership or admin access
		if (worklog.userId !== user._id && !user.roles?.includes("admin")) {
			throw new ConvexError("Unauthorized");
		}

		await ctx.db.delete(worklogId);

		return { success: true };
	},
});
