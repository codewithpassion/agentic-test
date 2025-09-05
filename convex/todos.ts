import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

// List all todos for the authenticated user
export const list = query({
	args: {},
	handler: async (ctx) => {
		const user = await requireAuth(ctx);

		const todos = await ctx.db
			.query("todos")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.order("desc")
			.collect();

		return todos;
	},
});

// Create a new todo
export const create = mutation({
	args: {
		text: v.string(),
	},
	handler: async (ctx, { text }) => {
		const user = await requireAuth(ctx);

		const todoId = await ctx.db.insert("todos", {
			userId: user._id,
			text,
			completed: false,
			createdAt: Date.now(),
		});

		const todo = await ctx.db.get(todoId);
		return todo;
	},
});

// Update a todo's completion status
export const update = mutation({
	args: {
		id: v.id("todos"),
		completed: v.boolean(),
	},
	handler: async (ctx, { id, completed }) => {
		const user = await requireAuth(ctx);

		// Get the todo to verify ownership
		const todo = await ctx.db.get(id);
		if (!todo) {
			throw new Error("Todo not found");
		}

		if (todo.userId !== user._id) {
			throw new Error("Unauthorized");
		}

		await ctx.db.patch(id, { completed });

		const updatedTodo = await ctx.db.get(id);
		return updatedTodo;
	},
});

// Delete a todo
export const remove = mutation({
	args: {
		id: v.id("todos"),
	},
	handler: async (ctx, { id }) => {
		const user = await requireAuth(ctx);

		// Get the todo to verify ownership
		const todo = await ctx.db.get(id);
		if (!todo) {
			throw new Error("Todo not found");
		}

		if (todo.userId !== user._id) {
			throw new Error("Unauthorized");
		}

		await ctx.db.delete(id);

		return { success: true };
	},
});
