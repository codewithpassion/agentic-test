import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Flag,
	Image,
	TrendingUp,
	Trophy,
	Users,
} from "lucide-react";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { trpc } from "~/lib/trpc";
import { cn } from "~/lib/utils";

export function AdminDashboard() {
	// These will be implemented when tRPC procedures are available
	// For now, we'll use mock data or handle loading states
	const competitionsQuery: {
		data: Array<{
			id: string;
			title: string;
			status: string;
			createdAt: string;
		}> | null;
		isLoading: boolean;
		error: unknown;
	} = {
		data: null,
		isLoading: false,
		error: null,
	};

	const statsQuery: {
		data: {
			activeCompetitions?: number;
			pendingPhotos?: number;
			totalPhotos?: number;
			openReports?: number;
		} | null;
		isLoading: boolean;
		error: unknown;
	} = {
		data: null,
		isLoading: false,
		error: null,
	};

	const isLoading = competitionsQuery.isLoading || statsQuery.isLoading;

	const quickStats = [
		{
			title: "Active Competitions",
			value: statsQuery.data?.activeCompetitions || 0,
			icon: Trophy,
			color: "text-blue-600",
			bgColor: "bg-blue-50",
		},
		{
			title: "Pending Photos",
			value: statsQuery.data?.pendingPhotos || 0,
			icon: Clock,
			color: "text-orange-600",
			bgColor: "bg-orange-50",
		},
		{
			title: "Total Submissions",
			value: statsQuery.data?.totalPhotos || 0,
			icon: Image,
			color: "text-green-600",
			bgColor: "bg-green-50",
		},
		{
			title: "Open Reports",
			value: statsQuery.data?.openReports || 0,
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
			<div>
				<h1 className="text-2xl font-bold text-gray-900">
					Welcome to Admin Dashboard
				</h1>
				<p className="text-gray-600">
					Manage your photo competitions and moderate content.
				</p>
			</div>

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
								{competitionsQuery.data.slice(0, 5).map((competition) => (
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
													? "default"
													: "secondary"
											}
										>
											{competition.status}
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
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm">Database Connection</span>
								<div className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									<span className="text-sm text-green-600">Connected</span>
								</div>
							</div>

							<div className="flex items-center justify-between">
								<span className="text-sm">File Storage</span>
								<div className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									<span className="text-sm text-green-600">Available</span>
								</div>
							</div>

							<div className="flex items-center justify-between">
								<span className="text-sm">Email Service</span>
								<div className="flex items-center gap-2">
									<AlertTriangle className="h-4 w-4 text-orange-500" />
									<span className="text-sm text-orange-600">Pending Setup</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
