import type { Todo } from "~/../../api/database/schema";
import { trpc } from "~/lib/trpc";

export const TodoItem = ({ todo }: { todo: Todo }) => {
	const utils = trpc.useContext();
	const updateTodo = trpc.todos.update.useMutation({
		onSuccess: () => {
			utils.todos.list.invalidate();
		},
	});
	const deleteTodo = trpc.todos.delete.useMutation({
		onSuccess: () => {
			utils.todos.list.invalidate();
		},
	});

	return (
		<div style={{ textDecoration: todo.completed ? "line-through" : "none" }}>
			<input
				type="checkbox"
				checked={todo.completed}
				onChange={() =>
					updateTodo.mutate({ id: todo.id, completed: !todo.completed })
				}
			/>
			{todo.text}
			<button type="button" onClick={() => deleteTodo.mutate({ id: todo.id })}>
				Delete
			</button>
		</div>
	);
};
