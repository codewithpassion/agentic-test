import { CheckSquare, ListTodo } from "lucide-react";
import type { MetaFunction } from "react-router";
import { PublicLayout } from "~/components/public-layout";
import { TodoList } from "~/components/todos/todo-list";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { useAuth } from "~/hooks/use-auth";

export const meta: MetaFunction = () => {
	return [
		{ title: "My Todos - Todo App" },
		{ name: "description", content: "Manage your tasks and stay organized" },
	];
};

export default function TodosPage() {
	const { user } = useAuth();

	return (
		<PublicLayout>
			<div className="min-h-[calc(100vh-200px)] bg-gray-50">
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					{/* Welcome Header */}
					<div className="mb-8 text-center">
						<div className="flex justify-center mb-4">
							<div className="bg-blue-100 p-3 rounded-full">
								<ListTodo className="h-8 w-8 text-blue-600" />
							</div>
						</div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							Welcome back, {user?.name || "User"}!
						</h1>
						<p className="text-gray-600">Here's what's on your plate today</p>
					</div>

					{/* Main Todo Card */}
					<Card className="shadow-sm">
						<CardHeader className="border-b bg-white">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-xl flex items-center gap-2">
										<CheckSquare className="h-5 w-5 text-gray-700" />
										My Tasks
									</CardTitle>
									<CardDescription className="mt-1">
										Add, edit, and manage your daily tasks
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-6 bg-gray-50">
							<TodoList />
						</CardContent>
					</Card>
				</div>
			</div>
		</PublicLayout>
	);
}
