import { CheckSquare, ListTodo, Users } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { useDashboard } from "~/hooks/use-dashboard";
import { cn } from "~/lib/utils";

export function AdminDashboard() {
	const { useOverview } = useDashboard();
	const overviewQuery = useOverview();

	const isLoading = overviewQuery.isLoading;
	const error = overviewQuery.error;

	if (error) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<p className="text-red-600">Failed to load dashboard data</p>
					<p className="text-sm text-gray-500 mt-1">{error.message}</p>
				</div>
			</div>
		);
	}

	const metrics = overviewQuery.data;

	const quickStats = [
		{
			title: "Total Todos",
			value: metrics?.todos.total || 0,
			icon: ListTodo,
			color: "text-blue-600",
			bgColor: "bg-blue-50",
			link: "/todos",
		},
		{
			title: "Completed Todos",
			value: metrics?.todos.completed || 0,
			icon: CheckSquare,
			color: "text-green-600",
			bgColor: "bg-green-50",
			link: "/todos",
		},
		{
			title: "Active Users",
			value: metrics?.users.total || 0,
			icon: Users,
			color: "text-purple-600",
			bgColor: "bg-purple-50",
			link: "/admin/users",
		},
	];

	const quickActions = [
		{
			title: "Manage Users",
			description: "User roles and permissions",
			href: "/admin/users",
			icon: Users,
			color: "bg-purple-500 hover:bg-purple-600",
		},
		{
			title: "View Todos",
			description: "See all user todos",
			href: "/todos",
			icon: ListTodo,
			color: "bg-blue-500 hover:bg-blue-600",
		},
	];

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Welcome message */}
			<div className="flex justify-end items-end">
				<Button
					variant="outline"
					size="sm"
					onClick={() => overviewQuery.refetch()}
					disabled={overviewQuery.isRefetching}
				>
					{overviewQuery.isRefetching ? "Refreshing..." : "Refresh"}
				</Button>
			</div>

			{/* Quick stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{quickStats.map((stat) => {
					const Icon = stat.icon;
					const cardContent = (
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">
										{stat.title}
									</p>
									<p className="text-2xl font-bold text-gray-900">
										{stat.value}
									</p>
								</div>
								<div className={cn("p-3 rounded-lg", stat.bgColor)}>
									<Icon className={cn("h-6 w-6", stat.color)} />
								</div>
							</div>
						</CardContent>
					);

					return (
						<div key={stat.title} className="h-full">
							{stat.link ? (
								<Link to={stat.link} className="block h-full">
									<Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
										{cardContent}
									</Card>
								</Link>
							) : (
								<Card className="h-full">{cardContent}</Card>
							)}
						</div>
					);
				})}
			</div>

			{/* Quick actions */}
			<Card>
				<CardHeader>
					<CardTitle>Quick Actions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{quickActions.map((action) => {
							const Icon = action.icon;
							return (
								<Button
									key={action.title}
									asChild
									variant="outline"
									className="h-auto p-4 flex-col items-start space-y-2"
								>
									<Link to={action.href}>
										<div
											className={cn("p-2 rounded-md text-white", action.color)}
										>
											<Icon className="h-5 w-5" />
										</div>
										<div className="text-left">
											<div className="font-medium">{action.title}</div>
											<div className="text-sm text-gray-500">
												{action.description}
											</div>
										</div>
									</Link>
								</Button>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{/* System status */}
			<Card>
				<CardHeader>
					<CardTitle>System Status</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="text-center">
								<div className="text-xl font-bold">
									{metrics?.users.total || 0}
								</div>
								<div className="text-sm text-gray-600">Total Users</div>
							</div>
							<div className="text-center">
								<div className="text-xl font-bold">
									{metrics?.users.admins || 0}
								</div>
								<div className="text-sm text-gray-600">Admins</div>
							</div>
						</div>

						<div className="space-y-3 pt-4 border-t">
							<div className="flex items-center justify-between">
								<span className="text-sm">Today's Activity</span>
							</div>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div className="flex justify-between">
									<span>New Todos:</span>
									<span className="font-semibold">
										{metrics?.today.newTodos || 0}
									</span>
								</div>
								<div className="flex justify-between">
									<span>Completed:</span>
									<span className="font-semibold">
										{metrics?.today.completedTodos || 0}
									</span>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
