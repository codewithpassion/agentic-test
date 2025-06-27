import { z } from "zod";
import { TodoService } from "../../services/todo-service";
import { protectedProcedure, router } from "../router";

export const todosRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		const todoService = new TodoService(ctx.db);
		return await todoService.getTodos(ctx.user.id);
	}),

	create: protectedProcedure
		.input(z.object({ text: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const todoService = new TodoService(ctx.db);
			return await todoService.createTodo({
				userId: ctx.user.id,
				text: input.text,
			});
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				completed: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const todoService = new TodoService(ctx.db);
			return await todoService.updateTodo(
				input.id,
				ctx.user.id,
				input.completed,
			);
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const todoService = new TodoService(ctx.db);
			await todoService.deleteTodo(input.id, ctx.user.id);
			return { success: true };
		}),
});
