import { useMutation } from "convex/react";
import { Trash2 } from "lucide-react";
import React from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { cn } from "~/lib/utils";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";

export const TodoItem = ({ todo }: { todo: Doc<"todos"> }) => {
	const updateTodo = useMutation(api.todos.update);
	const deleteTodo = useMutation(api.todos.remove);
	const [isUpdating, setIsUpdating] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);

	const handleUpdate = async (completed: boolean) => {
		setIsUpdating(true);
		try {
			await updateTodo({ id: todo._id, completed });
		} finally {
			setIsUpdating(false);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteTodo({ id: todo._id });
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="group flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
			<Checkbox
				checked={todo.completed}
				onCheckedChange={(checked) => handleUpdate(!!checked)}
				disabled={isUpdating}
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
				onClick={handleDelete}
				disabled={isDeleting}
				className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
			>
				<Trash2 className="h-4 w-4" />
			</Button>
		</div>
	);
};
