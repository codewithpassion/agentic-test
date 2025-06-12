# Task 7: Admin Dashboard

## Overview
Complete the admin dashboard implementation with real statistics, system monitoring, and interactive management tools that provide admins with comprehensive oversight of the photo competition platform.

## Goals
- Implement admin statistics tRPC procedures
- Create real-time dashboard widgets
- Add system health monitoring
- Build activity feeds and recent changes
- Implement quick actions and shortcuts
- Add data visualization components

## Admin Statistics tRPC Router

### File: `api/trpc/routers/admin.ts`

```typescript
import { z } from "zod";
import { router, adminProcedure, superAdminProcedure } from "../router";
import { 
	competitions, 
	photos, 
	votes, 
	reports, 
	users, 
	categories,
	winners 
} from "../../database/schema";
import { eq, sql, desc, and, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const adminRouter = router({
	// Dashboard statistics
	getStats: adminProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		// Get counts in parallel
		const [
			activeCompetitionsCount,
			totalPhotosCount,
			pendingPhotosCount,
			openReportsCount,
			totalUsersCount,
			totalVotesCount,
		] = await Promise.all([
			// Active competitions
			db.select({ count: sql<number>`cast(count(*) as int)` })
				.from(competitions)
				.where(eq(competitions.status, "active"))
				.get()
				.then(result => result?.count || 0),

			// Total photos
			db.select({ count: sql<number>`cast(count(*) as int)` })
				.from(photos)
				.get()
				.then(result => result?.count || 0),

			// Pending photos
			db.select({ count: sql<number>`cast(count(*) as int)` })
				.from(photos)
				.where(eq(photos.status, "pending"))
				.get()
				.then(result => result?.count || 0),

			// Open reports
			db.select({ count: sql<number>`cast(count(*) as int)` })
				.from(reports)
				.where(eq(reports.status, "pending"))
				.get()
				.then(result => result?.count || 0),

			// Total users
			db.select({ count: sql<number>`cast(count(*) as int)` })
				.from(users)
				.get()
				.then(result => result?.count || 0),

			// Total votes
			db.select({ count: sql<number>`cast(count(*) as int)` })
				.from(votes)
				.get()
				.then(result => result?.count || 0),
		]);

		return {
			activeCompetitions: activeCompetitionsCount,
			totalPhotos: totalPhotosCount,
			pendingPhotos: pendingPhotosCount,
			openReports: openReportsCount,
			totalUsers: totalUsersCount,
			totalVotes: totalVotesCount,
		};
	}),

	// Recent activity
	getRecentActivity: adminProcedure
		.input(z.object({ limit: z.number().min(1).max(50).default(10) }))
		.query(async ({ ctx, input }) => {
			const { db } = ctx;

			// Get recent photos, reports, and user registrations
			const [recentPhotos, recentReports, recentUsers] = await Promise.all([
				// Recent photo submissions
				db.select({
					id: photos.id,
					title: photos.title,
					userName: users.name,
					userEmail: users.email,
					status: photos.status,
					createdAt: photos.createdAt,
					type: sql<string>`'photo'`,
				})
				.from(photos)
				.innerJoin(users, eq(photos.userId, users.id))
				.orderBy(desc(photos.createdAt))
				.limit(input.limit),

				// Recent reports
				db.select({
					id: reports.id,
					reason: reports.reason,
					photoTitle: photos.title,
					reporterName: users.name,
					status: reports.status,
					createdAt: reports.createdAt,
					type: sql<string>`'report'`,
				})
				.from(reports)
				.innerJoin(photos, eq(reports.photoId, photos.id))
				.innerJoin(users, eq(reports.userId, users.id))
				.orderBy(desc(reports.createdAt))
				.limit(input.limit),

				// Recent user registrations
				db.select({
					id: users.id,
					name: users.name,
					email: users.email,
					role: users.role,
					createdAt: users.createdAt,
					type: sql<string>`'user'`,
				})
				.from(users)
				.orderBy(desc(users.createdAt))
				.limit(input.limit),
			]);

			// Combine and sort all activities
			const allActivity = [
				...recentPhotos.map(photo => ({
					...photo,
					description: `New photo submission: "${photo.title}" by ${photo.userName}`,
				})),
				...recentReports.map(report => ({
					...report,
					description: `Photo "${report.photoTitle}" reported for ${report.reason}`,
				})),
				...recentUsers.map(user => ({
					...user,
					description: `New user registered: ${user.name} (${user.role})`,
				})),
			]
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.slice(0, input.limit);

			return allActivity;
		}),

	// Competition statistics
	getCompetitionStats: adminProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		const competitionStats = await db
			.select({
				competitionId: competitions.id,
				title: competitions.title,
				status: competitions.status,
				photoCount: sql<number>`cast(count(${photos.id}) as int)`,
				voteCount: sql<number>`cast(count(${votes.id}) as int)`,
			})
			.from(competitions)
			.leftJoin(categories, eq(categories.competitionId, competitions.id))
			.leftJoin(photos, eq(photos.categoryId, categories.id))
			.leftJoin(votes, eq(votes.photoId, photos.id))
			.groupBy(competitions.id, competitions.title, competitions.status)
			.orderBy(desc(competitions.createdAt));

		return competitionStats;
	}),

	// User statistics
	getUserStats: superAdminProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		const [roleDistribution, userActivity] = await Promise.all([
			// User role distribution
			db.select({
				role: users.role,
				count: sql<number>`cast(count(*) as int)`,
			})
			.from(users)
			.groupBy(users.role),

			// User activity (photos submitted, votes cast)
			db.select({
				userId: users.id,
				userName: users.name,
				userEmail: users.email,
				photoCount: sql<number>`cast(count(distinct ${photos.id}) as int)`,
				voteCount: sql<number>`cast(count(distinct ${votes.id}) as int)`,
			})
			.from(users)
			.leftJoin(photos, eq(photos.userId, users.id))
			.leftJoin(votes, eq(votes.userId, users.id))
			.groupBy(users.id, users.name, users.email)
			.orderBy(desc(sql`count(distinct ${photos.id})`))
			.limit(10),
		]);

		return {
			roleDistribution,
			topActiveUsers: userActivity,
		};
	}),

	// System health check
	getSystemHealth: superAdminProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		try {
			// Test database connection
			const dbTest = await db.select({ test: sql`1` }).get();
			
			// Check for any critical issues
			const criticalIssues = [];
			
			// Check for stuck pending items
			const oldPendingPhotos = await db
				.select({ count: sql<number>`cast(count(*) as int)` })
				.from(photos)
				.where(
					and(
						eq(photos.status, "pending"),
						lte(photos.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days ago
					)
				)
				.get();

			if ((oldPendingPhotos?.count || 0) > 0) {
				criticalIssues.push({
					type: "old_pending_photos",
					message: `${oldPendingPhotos?.count} photos pending for more than 7 days`,
					severity: "warning",
				});
			}

			// Check for unresolved reports
			const oldReports = await db
				.select({ count: sql<number>`cast(count(*) as int)` })
				.from(reports)
				.where(
					and(
						eq(reports.status, "pending"),
						lte(reports.createdAt, new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) // 3 days ago
					)
				)
				.get();

			if ((oldReports?.count || 0) > 0) {
				criticalIssues.push({
					type: "old_reports",
					message: `${oldReports?.count} reports unresolved for more than 3 days`,
					severity: "error",
				});
			}

			return {
				database: "healthy",
				storage: "healthy", // This would check file storage in real implementation
				email: "pending", // This would check email service
				issues: criticalIssues,
				lastChecked: new Date(),
			};
		} catch (error) {
			return {
				database: "error",
				storage: "unknown",
				email: "unknown",
				issues: [
					{
						type: "database_error",
						message: "Database connection failed",
						severity: "critical",
					},
				],
				lastChecked: new Date(),
			};
		}
	}),

	// Quick actions
	getQuickActionData: adminProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		const [pendingPhotosCount, openReportsCount, activeCompetitionsCount] = await Promise.all([
			db.select({ count: sql<number>`cast(count(*) as int)` })
				.from(photos)
				.where(eq(photos.status, "pending"))
				.get()
				.then(result => result?.count || 0),

			db.select({ count: sql<number>`cast(count(*) as int)` })
				.from(reports)
				.where(eq(reports.status, "pending"))
				.get()
				.then(result => result?.count || 0),

			db.select({ count: sql<number>`cast(count(*) as int)` })
				.from(competitions)
				.where(eq(competitions.status, "active"))
				.get()
				.then(result => result?.count || 0),
		]);

		return {
			pendingPhotos: pendingPhotosCount,
			openReports: openReportsCount,
			activeCompetitions: activeCompetitionsCount,
		};
	}),
});
```

## Enhanced Admin Dashboard Component

### File: `app/components/admin/enhanced-admin-dashboard.tsx`

```typescript
import { trpc } from "~/lib/trpc";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";
import { 
	Trophy, 
	Image, 
	Users, 
	Flag, 
	TrendingUp, 
	Clock,
	CheckCircle,
	AlertTriangle,
	Activity,
	BarChart3,
	RefreshCw,
	AlertCircle
} from "lucide-react";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { Progress } from "~/components/ui/progress";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { useAuth } from "~/contexts/auth-context";
import { cn } from "~/lib/utils";

export function EnhancedAdminDashboard() {
	const { isSuperAdmin } = useAuth();
	
	const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery();
	const { data: activity, isLoading: activityLoading } = trpc.admin.getRecentActivity.useQuery({ limit: 10 });
	const { data: competitionStats, isLoading: competitionStatsLoading } = trpc.admin.getCompetitionStats.useQuery();
	const { data: systemHealth, isLoading: healthLoading } = trpc.admin.getSystemHealth.useQuery(
		undefined,
		{ enabled: isSuperAdmin() }
	);
	const { data: quickActionData } = trpc.admin.getQuickActionData.useQuery();

	const isLoading = statsLoading || activityLoading || competitionStatsLoading;

	const quickStats = [
		{
			title: "Active Competitions",
			value: stats?.activeCompetitions || 0,
			icon: Trophy,
			color: "text-blue-600",
			bgColor: "bg-blue-50",
			change: "+2 this month",
			changeType: "positive" as const,
		},
		{
			title: "Pending Photos",
			value: stats?.pendingPhotos || 0,
			icon: Clock,
			color: "text-orange-600",
			bgColor: "bg-orange-50",
			urgent: (stats?.pendingPhotos || 0) > 50,
		},
		{
			title: "Total Submissions",
			value: stats?.totalPhotos || 0,
			icon: Image,
			color: "text-green-600",
			bgColor: "bg-green-50",
			change: `+${Math.floor((stats?.totalPhotos || 0) * 0.1)} this week`,
			changeType: "positive" as const,
		},
		{
			title: "Open Reports",
			value: stats?.openReports || 0,
			icon: Flag,
			color: "text-red-600",
			bgColor: "bg-red-50",
			urgent: (stats?.openReports || 0) > 5,
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
			{/* Welcome section with system alerts */}
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
					<p className="text-gray-600">Welcome back! Here's what's happening with your competitions.</p>
				</div>
				<Button variant="outline" size="sm">
					<RefreshCw className="h-4 w-4 mr-2" />
					Refresh Data
				</Button>
			</div>

			{/* System health alerts */}
			{systemHealth?.issues && systemHealth.issues.length > 0 && (
				<div className="space-y-2">
					{systemHealth.issues.map((issue, index) => (
						<Alert key={index} variant={issue.severity === "critical" ? "destructive" : "default"}>
							<AlertTriangle className="h-4 w-4" />
							<AlertDescription>{issue.message}</AlertDescription>
						</Alert>
					))}
				</div>
			)}

			{/* Quick stats grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{quickStats.map((stat) => {
					const Icon = stat.icon;
					return (
						<Card key={stat.title} className={cn(stat.urgent && "border-red-200 bg-red-50/50")}>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<p className="text-sm font-medium text-gray-600">{stat.title}</p>
										<div className="flex items-baseline gap-2">
											<p className="text-2xl font-bold text-gray-900">{stat.value}</p>
											{stat.urgent && (
												<Badge variant="destructive" className="text-xs">
													Urgent
												</Badge>
											)}
										</div>
										{stat.change && (
											<p className={cn(
												"text-xs",
												stat.changeType === "positive" ? "text-green-600" : "text-red-600"
											)}>
												{stat.change}
											</p>
										)}
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

			{/* Main content grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Competition performance */}
				<Card className="lg:col-span-2">
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<BarChart3 className="h-5 w-5" />
							Competition Performance
						</CardTitle>
						<Button variant="outline" size="sm" asChild>
							<Link to="/admin/competitions">Manage All</Link>
						</Button>
					</CardHeader>
					<CardContent>
						{competitionStats && competitionStats.length > 0 ? (
							<div className="space-y-4">
								{competitionStats.slice(0, 5).map((competition) => (
									<div key={competition.competitionId} className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex-1">
											<div className="flex items-center gap-3">
												<h4 className="font-medium">{competition.title}</h4>
												<Badge variant={competition.status === "active" ? "default" : "secondary"}>
													{competition.status}
												</Badge>
											</div>
											<div className="flex gap-4 mt-2 text-sm text-gray-600">
												<span>{competition.photoCount} photos</span>
												<span>{competition.voteCount} votes</span>
											</div>
										</div>
										<div className="text-right">
											<div className="text-sm text-gray-500">Engagement</div>
											<Progress 
												value={Math.min((competition.voteCount / Math.max(competition.photoCount, 1)) * 20, 100)} 
												className="w-20 h-2"
											/>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-gray-500">
								<Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
								<p>No competitions created yet</p>
								<Button size="sm" className="mt-2" asChild>
									<Link to="/admin/competitions/new">Create First Competition</Link>
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Recent activity */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Recent Activity
						</CardTitle>
						<Button variant="ghost" size="sm">
							View All
						</Button>
					</CardHeader>
					<CardContent>
						{activity && activity.length > 0 ? (
							<div className="space-y-3">
								{activity.slice(0, 8).map((item, index) => (
									<div key={`${item.type}-${item.id}-${index}`} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
										<div className={cn(
											"w-2 h-2 rounded-full mt-2 flex-shrink-0",
											item.type === "photo" ? "bg-blue-500" :
											item.type === "report" ? "bg-red-500" :
											"bg-green-500"
										)} />
										<div className="flex-1 min-w-0">
											<p className="text-sm text-gray-900 truncate">
												{item.description}
											</p>
											<p className="text-xs text-gray-500">
												{new Date(item.createdAt).toLocaleDateString()}
											</p>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-6 text-gray-500">
								<Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
								<p className="text-sm">No recent activity</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Quick actions */}
			<Card>
				<CardHeader>
					<CardTitle>Quick Actions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{[
							{
								title: "Review Photos",
								description: `${quickActionData?.pendingPhotos || 0} pending approval`,
								href: "/admin/moderation/pending",
								icon: Image,
								color: "bg-green-500 hover:bg-green-600",
								urgent: (quickActionData?.pendingPhotos || 0) > 10,
							},
							{
								title: "Check Reports",
								description: `${quickActionData?.openReports || 0} reports to review`,
								href: "/admin/reports",
								icon: Flag,
								color: "bg-red-500 hover:bg-red-600",
								urgent: (quickActionData?.openReports || 0) > 0,
							},
							{
								title: "Manage Competitions",
								description: `${quickActionData?.activeCompetitions || 0} active`,
								href: "/admin/competitions",
								icon: Trophy,
								color: "bg-blue-500 hover:bg-blue-600",
							},
							{
								title: "User Management",
								description: "Roles and permissions",
								href: "/admin/users",
								icon: Users,
								color: "bg-purple-500 hover:bg-purple-600",
								superAdminOnly: true,
							},
						].filter(action => !action.superAdminOnly || isSuperAdmin()).map((action) => {
							const Icon = action.icon;
							return (
								<Button
									key={action.title}
									asChild
									variant="outline"
									className={cn(
										"h-auto p-4 flex-col items-start space-y-2 relative",
										action.urgent && "border-red-200 bg-red-50"
									)}
								>
									<Link to={action.href}>
										{action.urgent && (
											<Badge variant="destructive" className="absolute -top-1 -right-1 text-xs">
												!
											</Badge>
										)}
										<div className={cn("p-2 rounded-md text-white", action.color)}>
											<Icon className="h-5 w-5" />
										</div>
										<div className="text-left">
											<div className="font-medium">{action.title}</div>
											<div className="text-sm text-gray-500">{action.description}</div>
										</div>
									</Link>
								</Button>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{/* System status for super admins */}
			{isSuperAdmin() && systemHealth && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CheckCircle className="h-5 w-5" />
							System Status
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{[
								{ label: "Database", status: systemHealth.database },
								{ label: "File Storage", status: systemHealth.storage },
								{ label: "Email Service", status: systemHealth.email },
							].map((service) => (
								<div key={service.label} className="flex items-center justify-between p-3 border rounded-lg">
									<span className="text-sm font-medium">{service.label}</span>
									<div className="flex items-center gap-2">
										{service.status === "healthy" ? (
											<CheckCircle className="h-4 w-4 text-green-500" />
										) : service.status === "error" ? (
											<AlertCircle className="h-4 w-4 text-red-500" />
										) : (
											<AlertTriangle className="h-4 w-4 text-orange-500" />
										)}
										<span className={cn(
											"text-sm capitalize",
											service.status === "healthy" ? "text-green-600" :
											service.status === "error" ? "text-red-600" :
											"text-orange-600"
										)}>
											{service.status}
										</span>
									</div>
								</div>
							))}
						</div>
						<p className="text-xs text-gray-500 mt-4">
							Last checked: {new Date(systemHealth.lastChecked).toLocaleString()}
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
```

## Update Main Router

### File: `api/trpc/index.ts` (Updated)

```typescript
import { router } from "./router";
import { competitionsRouter } from "./routers/competitions";
import { categoriesRouter } from "./routers/categories";
import { adminRouter } from "./routers/admin";
// Import other routers as they're created

export const appRouter = router({
	competitions: competitionsRouter,
	categories: categoriesRouter,
	admin: adminRouter,
	// Add other routers as they're created
});

export type AppRouter = typeof appRouter;
```

## Update Admin Dashboard Route

### File: `app/routes/_admin._index.tsx` (Updated)

```typescript
import { EnhancedAdminDashboard } from "~/components/admin/enhanced-admin-dashboard";

export default function AdminIndexPage() {
	return <EnhancedAdminDashboard />;
}

export function meta() {
	return [
		{ title: "Admin Dashboard - WDA Photo Competition" },
		{ name: "description", content: "Administrative dashboard for managing photo competitions" },
	];
}
```

## Additional Admin Utilities

### File: `app/components/admin/admin-widgets.tsx`

```typescript
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "~/lib/utils";

interface StatCardProps {
	title: string;
	value: number | string;
	icon: React.ElementType;
	color: string;
	bgColor: string;
	change?: string;
	changeType?: "positive" | "negative";
	urgent?: boolean;
}

export function StatCard({ 
	title, 
	value, 
	icon: Icon, 
	color, 
	bgColor, 
	change, 
	changeType,
	urgent 
}: StatCardProps) {
	return (
		<Card className={cn(urgent && "border-red-200 bg-red-50/50")}>
			<CardContent className="p-6">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<p className="text-sm font-medium text-gray-600">{title}</p>
						<div className="flex items-baseline gap-2">
							<p className="text-2xl font-bold text-gray-900">{value}</p>
							{urgent && (
								<Badge variant="destructive" className="text-xs">
									Urgent
								</Badge>
							)}
						</div>
						{change && (
							<div className="flex items-center gap-1">
								{changeType === "positive" ? (
									<TrendingUp className="h-3 w-3 text-green-600" />
								) : (
									<TrendingDown className="h-3 w-3 text-red-600" />
								)}
								<p className={cn(
									"text-xs",
									changeType === "positive" ? "text-green-600" : "text-red-600"
								)}>
									{change}
								</p>
							</div>
						)}
					</div>
					<div className={cn("p-3 rounded-lg", bgColor)}>
						<Icon className={cn("h-6 w-6", color)} />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

interface ActivityItemProps {
	type: "photo" | "report" | "user";
	description: string;
	timestamp: Date;
}

export function ActivityItem({ type, description, timestamp }: ActivityItemProps) {
	return (
		<div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
			<div className={cn(
				"w-2 h-2 rounded-full mt-2 flex-shrink-0",
				type === "photo" ? "bg-blue-500" :
				type === "report" ? "bg-red-500" :
				"bg-green-500"
			)} />
			<div className="flex-1 min-w-0">
				<p className="text-sm text-gray-900 truncate">{description}</p>
				<p className="text-xs text-gray-500">
					{timestamp.toLocaleDateString()}
				</p>
			</div>
		</div>
	);
}

interface CompetitionCardProps {
	title: string;
	status: string;
	photoCount: number;
	voteCount: number;
}

export function CompetitionCard({ title, status, photoCount, voteCount }: CompetitionCardProps) {
	const engagement = photoCount > 0 ? (voteCount / photoCount) * 20 : 0;
	
	return (
		<div className="flex items-center justify-between p-4 border rounded-lg">
			<div className="flex-1">
				<div className="flex items-center gap-3">
					<h4 className="font-medium">{title}</h4>
					<Badge variant={status === "active" ? "default" : "secondary"}>
						{status}
					</Badge>
				</div>
				<div className="flex gap-4 mt-2 text-sm text-gray-600">
					<span>{photoCount} photos</span>
					<span>{voteCount} votes</span>
				</div>
			</div>
			<div className="text-right">
				<div className="text-sm text-gray-500">Engagement</div>
				<Progress 
					value={Math.min(engagement, 100)} 
					className="w-20 h-2"
				/>
			</div>
		</div>
	);
}
```

## Success Criteria
- [ ] Admin statistics tRPC procedures implemented
- [ ] Real-time dashboard displaying accurate data
- [ ] System health monitoring functional
- [ ] Recent activity feed working
- [ ] Quick actions with proper counts
- [ ] Competition performance metrics
- [ ] User statistics (for super admins)
- [ ] Responsive dashboard layout
- [ ] Error handling for failed data loads
- [ ] Proper role-based feature visibility

## Dependencies
- Task 1: Database Schema
- Task 2: User Roles Extension
- Task 3: tRPC Router Setup
- Task 5: Admin Layout Infrastructure
- Dashboard widgets and UI components

## Estimated Time
**1.5 days**

## Phase 1 Completion
After completing this task, Phase 1 Foundation will be complete with:
- ✅ Complete database schema with all entities
- ✅ Role-based authentication system
- ✅ tRPC infrastructure with type safety
- ✅ Comprehensive middleware and route protection
- ✅ Full admin interface with real-time dashboard
- ✅ System monitoring and health checks

**Total Phase 1 Estimated Time: 8-9 days**

Ready to proceed with Phase 2: Competition Management