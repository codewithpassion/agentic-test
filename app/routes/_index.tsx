/**
 * Public Homepage for Todo App
 */

import { CheckSquare, PlusCircle, Users } from "lucide-react";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link } from "react-router";
import { PublicLayout } from "~/components/public-layout";
import { useAuth } from "~/hooks/use-auth";

export const meta: MetaFunction = () => {
	return [
		{ title: "Todo App - Organize Your Tasks" },
		{
			name: "description",
			content:
				"A simple and efficient todo application to help you organize your tasks and boost productivity.",
		},
		{ property: "og:title", content: "Todo App" },
		{
			property: "og:description",
			content:
				"Organize your tasks efficiently with our simple todo application",
		},
		{ property: "og:type", content: "website" },
	];
};

export async function loader(args: LoaderFunctionArgs) {
	// Public homepage - no authentication required
	return {};
}

export default function HomePage() {
	const { user } = useAuth();

	return (
		<PublicLayout>
			{/* Hero Section */}
			<div className="relative bg-white py-16">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
						Welcome to Todo App
						<br />
						<span className="text-gray-700">Organize Your Life</span>
					</h1>
					<p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
						Keep track of your tasks, stay organized, and boost your
						productivity with our simple and intuitive todo application. Create,
						manage, and complete your todos with ease.
					</p>
					<Link
						to={user ? "/todos" : "/login"}
						className="inline-flex items-center space-x-2 px-8 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-lg"
					>
						<CheckSquare className="h-5 w-5" />
						<span>{user ? "Go to Your Todos" : "Get Started"}</span>
					</Link>
				</div>
			</div>

			{/* Features Section */}
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="text-center">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
							<PlusCircle className="h-8 w-8 text-blue-600" />
						</div>
						<h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
						<p className="text-gray-600">
							Add new tasks with just a few clicks. Our intuitive interface
							makes task management effortless.
						</p>
					</div>
					<div className="text-center">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
							<CheckSquare className="h-8 w-8 text-green-600" />
						</div>
						<h3 className="text-xl font-semibold mb-2">Track Progress</h3>
						<p className="text-gray-600">
							Mark tasks as complete and see your progress. Stay motivated as
							you accomplish your goals.
						</p>
					</div>
					<div className="text-center">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
							<Users className="h-8 w-8 text-purple-600" />
						</div>
						<h3 className="text-xl font-semibold mb-2">User Accounts</h3>
						<p className="text-gray-600">
							Create your personal account to save and access your todos from
							anywhere.
						</p>
					</div>
				</div>
			</div>

			{/* Call to Action Section */}
			<div className="bg-gray-800 py-16">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
						Start Organizing Today
					</h2>
					<p className="text-lg text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
						Join thousands of users who are already managing their tasks more
						efficiently. Sign up for free and start organizing your life today.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link
							to="/signup"
							className="inline-flex items-center justify-center px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
						>
							Create Account
						</Link>
						<Link
							to="/login"
							className="inline-flex items-center justify-center px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
						>
							Sign In
						</Link>
					</div>
				</div>
			</div>
		</PublicLayout>
	);
}
