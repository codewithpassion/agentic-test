import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	users: defineTable({
		email: v.string(),
		name: v.optional(v.string()),
		clerkId: v.string(),
		imageUrl: v.optional(v.string()),
		roles: v.optional(v.array(v.string())), // Store user roles from Clerk
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_email", ["email"])
		.index("by_clerkId", ["clerkId"]),

	todos: defineTable({
		userId: v.id("users"),
		text: v.string(),
		completed: v.boolean(),
		createdAt: v.number(),
	})
		.index("by_user", ["userId", "createdAt"])
		.index("by_user_completed", ["userId", "completed", "createdAt"]),
});
