import type { Todo } from "~/../../api/database/schema";
import { trpc } from "~/lib/trpc";
import { AddTodoForm } from "./add-todo-form";
import { TodoItem } from "./todo-item";

export const TodoList = () => {
	const { data: todos, isLoading } = trpc.todos.list.useQuery();

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div>
			<AddTodoForm />
			{todos?.map((todo: Todo) => (
				<TodoItem key={todo.id} todo={todo} />
			))}
		</div>
	);
};
