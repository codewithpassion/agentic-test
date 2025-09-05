import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// Get current user (read-only, no creation)
export const getMe = query({
	args: {},
	handler: async (ctx: QueryCtx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
			.unique();

		return user;
	},
});

// Sync user from Clerk (called from client-side)
export const syncUser = mutation({
	args: {
		clerkId: v.string(),
		email: v.string(),
		name: v.optional(v.string()),
		imageUrl: v.optional(v.string()),
		roles: v.optional(v.array(v.string())),
	},
	handler: async (
		ctx: MutationCtx,
		{ clerkId, email, name, imageUrl, roles },
	) => {
		// Check if user already exists
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
			.unique();

		if (existingUser) {
			// Update existing user
			await ctx.db.patch(existingUser._id, {
				email,
				name,
				imageUrl,
				roles: roles || ["user"],
				updatedAt: Date.now(),
			});
			return existingUser._id;
		}

		// Create new user
		const userId = await ctx.db.insert("users", {
			clerkId,
			email,
			name,
			imageUrl,
			roles: roles || ["user"],
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return userId;
	},
});

// Internal sync user from Clerk webhooks
export const syncUserInternal = internalMutation({
	args: {
		clerkId: v.string(),
		email: v.string(),
		name: v.optional(v.string()),
		imageUrl: v.optional(v.string()),
		roles: v.optional(v.array(v.string())),
	},
	handler: async (
		ctx: MutationCtx,
		{ clerkId, email, name, imageUrl, roles },
	) => {
		// Check if user already exists
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
			.unique();

		if (existingUser) {
			// Update existing user
			await ctx.db.patch(existingUser._id, {
				email,
				name,
				imageUrl,
				roles: roles || existingUser.roles || ["user"],
				updatedAt: Date.now(),
			});
			return existingUser._id;
		}

		// Create new user
		const userId = await ctx.db.insert("users", {
			clerkId,
			email,
			name,
			imageUrl,
			roles: roles || ["user"],
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return userId;
	},
});

// Delete user (for cleanup when user is deleted from Clerk)
export const deleteUser = internalMutation({
	args: {
		clerkId: v.string(),
	},
	handler: async (ctx: MutationCtx, { clerkId }) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
			.unique();

		if (!user) {
			throw new ConvexError("User not found");
		}

		// Delete all todos for this user
		const todos = await ctx.db
			.query("todos")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.collect();

		for (const todo of todos) {
			await ctx.db.delete(todo._id);
		}

		// Delete the user
		await ctx.db.delete(user._id);

		return { success: true };
	},
});

// Get user stats (for dashboard)
export const getStats = query({
	args: {},
	handler: async (ctx: QueryCtx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
			.unique();

		if (!user) {
			return null;
		}

		const todos = await ctx.db
			.query("todos")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.collect();

		const completedTodos = todos.filter((todo) => todo.completed);

		return {
			totalTodos: todos.length,
			completedTodos: completedTodos.length,
			pendingTodos: todos.length - completedTodos.length,
		};
	},
});

// Get admin stats (system-wide statistics for admin dashboard)
export const getAdminStats = query({
	args: {},
	handler: async (ctx: QueryCtx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		// Check if user is admin - you may want to add role checking here
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
			.unique();

		if (!user) {
			return null;
		}

		// Get all todos for system-wide stats
		const allTodos = await ctx.db.query("todos").collect();
		const completedTodos = allTodos.filter((todo) => todo.completed);

		// Get all users
		const allUsers = await ctx.db.query("users").collect();
		// Since role is not in schema yet, assume no admins for now
		// TODO: Add role field to users schema and implement role checking
		const adminUsers = [];

		// Get today's stats (assuming createdAt is timestamp in milliseconds)
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayTimestamp = today.getTime();
		const tomorrowTimestamp = todayTimestamp + 24 * 60 * 60 * 1000;

		const todaysTodos = allTodos.filter(
			(todo) =>
				todo.createdAt >= todayTimestamp && todo.createdAt < tomorrowTimestamp,
		);
		// Since there's no updatedAt field in todos schema, we'll use a simpler approach
		// Count completed todos that were created today (approximation)
		const todaysCompletedTodos = todaysTodos.filter((todo) => todo.completed);

		return {
			todos: {
				total: allTodos.length,
				completed: completedTodos.length,
				pending: allTodos.length - completedTodos.length,
			},
			users: {
				total: allUsers.length,
				admins: adminUsers.length,
			},
			today: {
				newTodos: todaysTodos.length,
				completedTodos: todaysCompletedTodos.length,
			},
		};
	},
});
