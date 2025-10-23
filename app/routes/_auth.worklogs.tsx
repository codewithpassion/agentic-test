import { Calendar, Clock } from "lucide-react";
import type { MetaFunction } from "react-router";
import { WorklogForm } from "~/components/features/worklogs/worklog-form";
import { WorklogList } from "~/components/features/worklogs/worklog-list";
import { PublicLayout } from "~/components/layouts/public-layout";
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
		{ title: "My Worklogs - Worklog Tracker" },
		{
			name: "description",
			content: "Track your work hours and view your time logs",
		},
	];
};

export default function WorklogsPage() {
	const { user } = useAuth();

	return (
		<PublicLayout>
			<div className="min-h-[calc(100vh-200px)] bg-gray-50">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					{/* Welcome Header */}
					<div className="mb-8 text-center">
						<div className="flex justify-center mb-4">
							<div className="bg-blue-100 p-3 rounded-full">
								<Clock className="h-8 w-8 text-blue-600" />
							</div>
						</div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							Welcome back, {user?.name || "User"}!
						</h1>
						<p className="text-gray-600">
							Track your work hours and manage your time logs
						</p>
					</div>

					{/* Log Work Hours Card */}
					<Card className="shadow-sm mb-8">
						<CardHeader className="border-b bg-white">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-xl flex items-center gap-2">
										<Calendar className="h-5 w-5 text-gray-700" />
										Log Work Hours
									</CardTitle>
									<CardDescription className="mt-1">
										Add a new worklog entry for today or any other day
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-6 bg-white">
							<WorklogForm />
						</CardContent>
					</Card>

					{/* Worklog History Card */}
					<Card className="shadow-sm">
						<CardHeader className="border-b bg-white">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-xl flex items-center gap-2">
										<Clock className="h-5 w-5 text-gray-700" />
										My Worklog History
									</CardTitle>
									<CardDescription className="mt-1">
										View your time logs with overtime and undertime indicators
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-6 bg-gray-50">
							<WorklogList />
						</CardContent>
					</Card>
				</div>
			</div>
		</PublicLayout>
	);
}
