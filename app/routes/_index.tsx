/**
 * Public Homepage for Worktime Tracker
 */

import { BarChart3, Clock, Users } from "lucide-react";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link } from "react-router";
import { PublicLayout } from "~/components/layouts/public-layout";
import { useAuth } from "~/hooks/use-auth";

export const meta: MetaFunction = () => {
	return [
		{ title: "Worktime Tracker - Track Your Time" },
		{
			name: "description",
			content:
				"A modern time tracking application to help you monitor work hours and boost productivity.",
		},
		{ property: "og:title", content: "Worktime Tracker" },
		{
			property: "og:description",
			content:
				"Track your work hours efficiently with our modern time tracking application",
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
						Welcome to Worktime Tracker
						<br />
						<span className="text-gray-700">Track Your Productivity</span>
					</h1>
					<p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
						Monitor your work hours, track productivity, and optimize your time
						management with our modern time tracking application. Log hours,
						view analytics, and boost your efficiency.
					</p>
					<Link
						to={user ? "/dashboard" : "/login"}
						className="inline-flex items-center space-x-2 px-8 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-lg"
					>
						<Clock className="h-5 w-5" />
						<span>{user ? "Go to Dashboard" : "Get Started"}</span>
					</Link>
				</div>
			</div>

			{/* Features Section */}
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="text-center">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
							<Clock className="h-8 w-8 text-blue-600" />
						</div>
						<h3 className="text-xl font-semibold mb-2">Time Tracking</h3>
						<p className="text-gray-600">
							Log your work hours with precision. Our intuitive interface makes
							time tracking effortless and accurate.
						</p>
					</div>
					<div className="text-center">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
							<BarChart3 className="h-8 w-8 text-green-600" />
						</div>
						<h3 className="text-xl font-semibold mb-2">Analytics</h3>
						<p className="text-gray-600">
							View detailed reports and insights about your productivity.
							Analyze patterns and optimize your workflow.
						</p>
					</div>
					<div className="text-center">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
							<Users className="h-8 w-8 text-purple-600" />
						</div>
						<h3 className="text-xl font-semibold mb-2">Team Management</h3>
						<p className="text-gray-600">
							Manage team members and track collective productivity. Perfect for
							teams and organizations.
						</p>
					</div>
				</div>
			</div>

			{/* Call to Action Section */}
			<div className="bg-gray-800 py-16">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
						Start Tracking Today
					</h2>
					<p className="text-lg text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
						Join professionals who are already monitoring their productivity
						more effectively. Sign in and start optimizing your time today.
					</p>
					<div className="flex justify-center">
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
