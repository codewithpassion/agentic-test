import { useState } from "react";
import { trpc } from "~/lib/trpc";

export const AddTodoForm = () => {
	const [text, setText] = useState("");
	const utils = trpc.useContext();
	const createTodo = trpc.todos.create.useMutation({
		onSuccess: () => {
			utils.todos.list.invalidate();
			setText("");
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				createTodo.mutate({ text });
			}}
		>
			<input
				type="text"
				value={text}
				onChange={(e) => setText(e.target.value)}
			/>
			<button type="submit">Add Todo</button>
		</form>
	);
};
