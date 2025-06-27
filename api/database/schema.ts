import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Import the user table from better-auth schema
import { user } from "../../packages/better-auth/db/auth-schema";

// Todos table
export const todos = sqliteTable("todos", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	text: text("text").notNull(),
	completed: integer("completed", { mode: "boolean" }).notNull().default(false),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

// Relations
export const todosRelations = relations(todos, ({ one }) => ({
	user: one(user, {
		fields: [todos.userId],
		references: [user.id],
	}),
}));

// User relations
export const userRelations = relations(user, ({ many }) => ({
	todos: many(todos),
}));

// Re-export user table and types
export { user };
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

// Type exports
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
