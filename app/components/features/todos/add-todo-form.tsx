import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "../../../../convex/_generated/api";

export const AddTodoForm = () => {
	const [text, setText] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const createTodo = useMutation(api.todos.create);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (text.trim()) {
			setIsCreating(true);
			try {
				await createTodo({ text: text.trim() });
				setText("");
			} finally {
				setIsCreating(false);
			}
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex gap-2">
			<Input
				type="text"
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder="Add a new task..."
				disabled={isCreating}
				className="flex-1"
			/>
			<Button
				type="submit"
				disabled={!text.trim() || isCreating}
				className="gap-2"
			>
				<Plus className="h-4 w-4" />
				Add Task
			</Button>
		</form>
	);
};
