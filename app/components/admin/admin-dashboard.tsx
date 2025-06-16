import { Clock, Flag, Image, Trophy, Users } from "lucide-react";
import { Link } from "react-router";
import type { Competition } from "~/../../api/database/schema";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { useDashboard } from "~/hooks/use-dashboard";
import { trpc } from "~/lib/trpc";
import { cn } from "~/lib/utils";

export function AdminDashboard() {
	const { useOverview } = useDashboard();
	const competitionsQuery = trpc.competitions.list.useQuery({});
	const overviewQuery = useOverview();

	const isLoading = competitionsQuery.isLoading || overviewQuery.isLoading;
	const error = competitionsQuery.error || overviewQuery.error;

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
	const activeCompetitionsCount =
		competitionsQuery.data?.filter((c: Competition) => c.status === "active")
			.length || 0;

	const quickStats = [
		{
			title: "Active Competitions",
			value: activeCompetitionsCount,
			icon: Trophy,
			color: "text-blue-600",
			bgColor: "bg-blue-50",
		},
		{
			title: "Pending Photos",
			value: metrics?.pending.photos || 0,
			icon: Clock,
			color: "text-orange-600",
			bgColor: "bg-orange-50",
		},
		{
			title: "Today's Photos",
			value: metrics?.today.newPhotos || 0,
			icon: Image,
			color: "text-green-600",
			bgColor: "bg-green-50",
		},
		{
			title: "Open Reports",
			value: metrics?.pending.reports || 0,
			icon: Flag,
			color: "text-red-600",
			bgColor: "bg-red-50",
		},
	];

	const quickActions = [
		{
			title: "Create Competition",
			description: "Start a new photo competition",
			href: "/admin/competitions/new",
			icon: Trophy,
			color: "bg-blue-500 hover:bg-blue-600",
		},
		{
			title: "Review Photos",
			description: "Moderate pending submissions",
			href: "/admin/moderation/pending",
			icon: Image,
			color: "bg-green-500 hover:bg-green-600",
		},
		{
			title: "Check Reports",
			description: "Review reported content",
			href: "/admin/reports",
			icon: Flag,
			color: "bg-red-500 hover:bg-red-600",
		},
		{
			title: "Manage Users",
			description: "User roles and permissions",
			href: "/admin/users",
			icon: Users,
			color: "bg-purple-500 hover:bg-purple-600",
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
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">
						Welcome to Admin Dashboard
					</h1>
					<p className="text-gray-600">
						Manage your photo competitions and moderate content.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => overviewQuery.refetch()}
					disabled={overviewQuery.isRefetching}
				>
					{overviewQuery.isRefetching ? "Refreshing..." : "Refresh"}
				</Button>
			</div>

			{/* Active Competition Overview */}
			{metrics?.activeCompetition && (
				<Card>
					<CardHeader>
						<CardTitle>Active Competition</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<div>
								<h3 className="font-semibold text-lg">
									{metrics.activeCompetition.title}
								</h3>
								<p className="text-sm text-gray-600">
									{metrics.activeCompetition.daysRemaining} days remaining
								</p>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold">
									{metrics.activeCompetition.totalPhotos}
								</div>
								<div className="text-sm text-gray-600">Total Photos</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold">
									{metrics.activeCompetition.totalVotes}
								</div>
								<div className="text-sm text-gray-600">Total Votes</div>
							</div>
							<div className="text-center">
								<Button asChild>
									<Link
										to={`/admin/competitions/${metrics.activeCompetition.id}`}
									>
										Manage Competition
									</Link>
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Quick stats */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{quickStats.map((stat) => {
					const Icon = stat.icon;
					return (
						<Card key={stat.title}>
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
						</Card>
					);
				})}
			</div>

			{/* Quick actions */}
			<Card>
				<CardHeader>
					<CardTitle>Quick Actions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

			{/* Recent activity */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Recent competitions */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Recent Competitions</CardTitle>
						<Button variant="outline" size="sm" asChild>
							<Link to="/admin/competitions">View All</Link>
						</Button>
					</CardHeader>
					<CardContent>
						{competitionsQuery.data && competitionsQuery.data.length > 0 ? (
							<div className="space-y-3">
								{competitionsQuery.data
									.slice(0, 5)
									.map((competition: Competition) => (
										<div
											key={competition.id}
											className="flex items-center justify-between p-3 border rounded-lg"
										>
											<div>
												<h4 className="font-medium">{competition.title}</h4>
												<p className="text-sm text-gray-500">
													{new Date(competition.createdAt).toLocaleDateString()}
												</p>
											</div>
											<Badge
												variant={
													competition.status === "active"
														? "active"
														: competition.status === "draft"
															? "draft"
															: competition.status === "completed"
																? "completed"
																: "inactive"
												}
											>
												{competition.status === "active"
													? "Active"
													: competition.status === "draft"
														? "Draft"
														: competition.status === "completed"
															? "Completed"
															: "Inactive"}
											</Badge>
										</div>
									))}
							</div>
						) : (
							<div className="text-center py-6 text-gray-500">
								<Trophy className="h-12 w-12 mx-auto mb-2 text-gray-300" />
								<p>No competitions yet</p>
								<Button size="sm" className="mt-2" asChild>
									<Link to="/admin/competitions/new">
										Create First Competition
									</Link>
								</Button>
							</div>
						)}
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
										<span>New Users:</span>
										<span className="font-semibold">
											{metrics?.today.newUsers || 0}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Votes Cast:</span>
										<span className="font-semibold">
											{metrics?.today.totalVotes || 0}
										</span>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
