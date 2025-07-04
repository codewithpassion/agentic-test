import { Trash2 } from "lucide-react";
import type { Todo } from "~/../../api/database/schema";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { trpc } from "~/lib/trpc";
import { cn } from "~/lib/utils";

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
		<div className="group flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
			<Checkbox
				checked={todo.completed}
				onCheckedChange={(checked) =>
					updateTodo.mutate({ id: todo.id, completed: !!checked })
				}
				disabled={updateTodo.isPending}
				className="h-5 w-5"
			/>
			<span
				className={cn(
					"flex-1 text-gray-900",
					todo.completed && "line-through text-gray-500",
				)}
			>
				{todo.text}
			</span>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={() => deleteTodo.mutate({ id: todo.id })}
				disabled={deleteTodo.isPending}
				className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
			>
				<Trash2 className="h-4 w-4" />
			</Button>
		</div>
	);
};
