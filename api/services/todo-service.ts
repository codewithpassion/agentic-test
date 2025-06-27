import { and, eq } from "drizzle-orm";
import type { Database } from "../database/db";
import { type NewTodo, type Todo, todos } from "../database/schema";
import { generateId } from "../lib/utils";

export class TodoService {
	constructor(private db: Database) {}

	async getTodos(userId: string) {
		return await this.db.select().from(todos).where(eq(todos.userId, userId));
	}

	async createTodo(data: { userId: string; text: string }) {
		const newTodo: NewTodo = {
			id: generateId(),
			userId: data.userId,
			text: data.text,
			completed: false,
		};

		const result = await this.db.insert(todos).values(newTodo).returning();
		return result[0];
	}

	async updateTodo(id: string, userId: string, completed: boolean) {
		const result = await this.db
			.update(todos)
			.set({ completed })
			.where(and(eq(todos.id, id), eq(todos.userId, userId)))
			.returning();
		return result[0];
	}

	async deleteTodo(id: string, userId: string) {
		await this.db
			.delete(todos)
			.where(and(eq(todos.id, id), eq(todos.userId, userId)));
	}
}
