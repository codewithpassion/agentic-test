import { count, eq, gte, sql } from "drizzle-orm";
import type { Database } from "../../api/database/db";
import { todos, user } from "../../api/database/schema";

export class DashboardService {
	constructor(private db: Database) {}

	async getOverview() {
		const startOfDay = new Date();
		startOfDay.setHours(0, 0, 0, 0);

		// Get user stats
		const userStats = await this.db
			.select({
				total: count(user.id),
				admins: count(
					sql`CASE WHEN ${user.roles} IN ('admin', 'superadmin') THEN 1 END`,
				),
			})
			.from(user)
			.get();

		// Get todo stats
		const todoStats = await this.db
			.select({
				total: count(todos.id),
				completed: count(sql`CASE WHEN ${todos.completed} = 1 THEN 1 END`),
			})
			.from(todos)
			.get();

		// Get today's stats
		const todayStats = await this.db
			.select({
				newTodos: count(
					sql`CASE WHEN ${todos.createdAt} >= ${startOfDay} THEN 1 END`,
				),
				completedTodos: count(
					sql`CASE WHEN ${todos.completed} = 1 AND ${todos.createdAt} >= ${startOfDay} THEN 1 END`,
				),
			})
			.from(todos)
			.get();

		return {
			users: {
				total: userStats?.total || 0,
				admins: userStats?.admins || 0,
			},
			todos: {
				total: todoStats?.total || 0,
				completed: todoStats?.completed || 0,
			},
			today: {
				newTodos: todayStats?.newTodos || 0,
				completedTodos: todayStats?.completedTodos || 0,
			},
		};
	}
}
