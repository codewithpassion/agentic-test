# Task 5: Admin Layout Infrastructure

## Overview
Create the foundational admin interface with navigation, layout components, and role-based menu systems that will serve as the base for all admin functionality.

## Goals
- Build responsive admin layout shell
- Create role-based navigation sidebar
- Implement admin header with user info
- Set up breadcrumb navigation
- Create placeholder admin pages
- Ensure mobile responsiveness

## Admin Layout Shell

### File: `app/components/admin/admin-layout.tsx`

```typescript
import { Outlet } from "react-router";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { AdminBreadcrumbs } from "./admin-breadcrumbs";
import { useAuth } from "~/contexts/auth-context";
import { AdminOnly } from "~/components/auth/role-guard";
import { Navigate } from "react-router";
import { useState } from "react";
import { cn } from "~/lib/utils";

export function AdminLayout() {
	const { isAdmin } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	// Redirect non-admin users
	if (!isAdmin()) {
		return <Navigate to="/unauthorized" replace />;
	}

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Sidebar */}
			<AdminSidebar 
				isOpen={sidebarOpen} 
				onClose={() => setSidebarOpen(false)} 
			/>
			
			{/* Main content area */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Header */}
				<AdminHeader onMenuClick={() => setSidebarOpen(true)} />
				
				{/* Breadcrumbs */}
				<AdminBreadcrumbs />
				
				{/* Main content */}
				<main className="flex-1 overflow-y-auto bg-white">
					<div className="container mx-auto px-4 py-6">
						<Outlet />
					</div>
				</main>
			</div>
			
			{/* Mobile sidebar overlay */}
			{sidebarOpen && (
				<div 
					className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}
		</div>
	);
}
```

### File: `app/components/admin/admin-sidebar.tsx`

```typescript
import { Link, useLocation } from "react-router";
import { cn } from "~/lib/utils";
import { useAuth } from "~/contexts/auth-context";
import { 
	LayoutDashboard, 
	Trophy, 
	Image, 
	Flag, 
	Users, 
	Settings,
	ChevronRight,
	X
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

interface AdminSidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

interface NavItem {
	icon: React.ElementType;
	label: string;
	href: string;
	permission?: string;
	role?: string;
	children?: NavItem[];
}

const navigationItems: NavItem[] = [
	{
		icon: LayoutDashboard,
		label: "Dashboard",
		href: "/admin",
	},
	{
		icon: Trophy,
		label: "Competitions",
		href: "/admin/competitions",
		permission: "manage_competitions",
		children: [
			{
				icon: ChevronRight,
				label: "All Competitions",
				href: "/admin/competitions",
			},
			{
				icon: ChevronRight,
				label: "Categories",
				href: "/admin/competitions/categories",
			},
			{
				icon: ChevronRight,
				label: "Winners",
				href: "/admin/competitions/winners",
			},
		],
	},
	{
		icon: Image,
		label: "Photo Moderation",
		href: "/admin/moderation",
		permission: "moderate_content",
		children: [
			{
				icon: ChevronRight,
				label: "Pending Photos",
				href: "/admin/moderation/pending",
			},
			{
				icon: ChevronRight,
				label: "All Photos",
				href: "/admin/moderation/photos",
			},
		],
	},
	{
		icon: Flag,
		label: "Reports",
		href: "/admin/reports",
		permission: "view_reports",
	},
	{
		icon: Users,
		label: "User Management",
		href: "/admin/users",
		role: "superadmin",
		children: [
			{
				icon: ChevronRight,
				label: "All Users",
				href: "/admin/users",
			},
			{
				icon: ChevronRight,
				label: "Roles & Permissions",
				href: "/admin/users/roles",
			},
		],
	},
	{
		icon: Settings,
		label: "Settings",
		href: "/admin/settings",
		role: "superadmin",
	},
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
	const location = useLocation();
	const { hasPermission, hasRole } = useAuth();

	const isItemVisible = (item: NavItem) => {
		if (item.permission && !hasPermission(item.permission as any)) return false;
		if (item.role && !hasRole(item.role as any)) return false;
		return true;
	};

	const isItemActive = (href: string) => {
		if (href === "/admin") {
			return location.pathname === "/admin";
		}
		return location.pathname.startsWith(href);
	};

	return (
		<aside
			className={cn(
				"fixed left-0 top-0 z-50 h-screen w-64 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
				isOpen ? "translate-x-0" : "-translate-x-full"
			)}
		>
			{/* Sidebar header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-200">
				<h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
					className="lg:hidden"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto p-4">
				<ul className="space-y-2">
					{navigationItems.map((item) => {
						if (!isItemVisible(item)) return null;

						const Icon = item.icon;
						const isActive = isItemActive(item.href);

						return (
							<li key={item.href}>
								<Link
									to={item.href}
									onClick={onClose}
									className={cn(
										"flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
										isActive
											? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
											: "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
									)}
								>
									<Icon className="h-5 w-5" />
									{item.label}
								</Link>

								{/* Sub-navigation */}
								{item.children && isActive && (
									<ul className="mt-2 ml-8 space-y-1">
										{item.children.map((child) => (
											<li key={child.href}>
												<Link
													to={child.href}
													onClick={onClose}
													className={cn(
														"flex items-center gap-2 px-3 py-1 text-xs rounded-md transition-colors",
														location.pathname === child.href
															? "bg-blue-50 text-blue-700"
															: "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
													)}
												>
													<ChevronRight className="h-3 w-3" />
													{child.label}
												</Link>
											</li>
										))}
									</ul>
								)}
							</li>
						);
					})}
				</ul>
			</nav>

			{/* Sidebar footer */}
			<div className="p-4 border-t border-gray-200">
				<div className="text-xs text-gray-500 text-center">
					Wildlife Disease Association
					<br />
					Photo Competition Admin
				</div>
			</div>
		</aside>
	);
}
```

### File: `app/components/admin/admin-header.tsx`

```typescript
import { Button } from "~/components/ui/button";
import { useAuth } from "~/contexts/auth-context";
import { Menu, Bell, User, LogOut, Home } from "lucide-react";
import { Link } from "react-router";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";

interface AdminHeaderProps {
	onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
	const { user } = useAuth();

	const getInitials = (name?: string) => {
		if (!name) return "A";
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase();
	};

	const getRoleBadgeColor = (role: string) => {
		switch (role) {
			case "superadmin":
				return "bg-red-100 text-red-800";
			case "admin":
				return "bg-blue-100 text-blue-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<header className="bg-white border-b border-gray-200 px-4 py-3">
			<div className="flex items-center justify-between">
				{/* Left side - Menu button and title */}
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={onMenuClick}
						className="lg:hidden"
					>
						<Menu className="h-5 w-5" />
					</Button>
					
					<div>
						<h1 className="text-xl font-semibold text-gray-900">
							Admin Dashboard
						</h1>
						<p className="text-sm text-gray-500">
							Wildlife Disease Association Photo Competition
						</p>
					</div>
				</div>

				{/* Right side - Actions and user menu */}
				<div className="flex items-center gap-4">
					{/* View site link */}
					<Button variant="outline" size="sm" asChild>
						<Link to="/">
							<Home className="h-4 w-4 mr-2" />
							View Site
						</Link>
					</Button>

					{/* Notifications */}
					<Button variant="ghost" size="sm" className="relative">
						<Bell className="h-5 w-5" />
						{/* Notification badge - placeholder for future implementation */}
						<Badge 
							variant="destructive" 
							className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
						>
							3
						</Badge>
					</Button>

					{/* User menu */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="flex items-center gap-2 p-2">
								<Avatar className="h-8 w-8">
									<AvatarImage src={user?.image || undefined} />
									<AvatarFallback className="text-sm">
										{getInitials(user?.name)}
									</AvatarFallback>
								</Avatar>
								<div className="text-left hidden md:block">
									<div className="text-sm font-medium">{user?.name || "Admin"}</div>
									<div className="flex items-center gap-2">
										<span className="text-xs text-gray-500">{user?.email}</span>
										<Badge 
											variant="secondary" 
											className={cn("text-xs", getRoleBadgeColor(user?.role || "user"))}
										>
											{user?.role || "user"}
										</Badge>
									</div>
								</div>
							</Button>
						</DropdownMenuTrigger>
						
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuLabel>My Account</DropdownMenuLabel>
							<DropdownMenuSeparator />
							
							<DropdownMenuItem asChild>
								<Link to="/admin/profile">
									<User className="h-4 w-4 mr-2" />
									Profile Settings
								</Link>
							</DropdownMenuItem>
							
							<DropdownMenuItem asChild>
								<Link to="/admin/preferences">
									<Settings className="h-4 w-4 mr-2" />
									Preferences
								</Link>
							</DropdownMenuItem>
							
							<DropdownMenuSeparator />
							
							<DropdownMenuItem asChild>
								<Link to="/logout">
									<LogOut className="h-4 w-4 mr-2" />
									Sign Out
								</Link>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
```

### File: `app/components/admin/admin-breadcrumbs.tsx`

```typescript
import { useLocation, Link } from "react-router";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "~/lib/utils";

interface BreadcrumbItem {
	label: string;
	href?: string;
}

const routeMap: Record<string, string> = {
	admin: "Dashboard",
	competitions: "Competitions",
	moderation: "Photo Moderation",
	pending: "Pending Photos",
	photos: "All Photos",
	reports: "Reports",
	users: "User Management",
	roles: "Roles & Permissions",
	settings: "Settings",
	categories: "Categories",
	winners: "Winners",
};

export function AdminBreadcrumbs() {
	const location = useLocation();
	
	const generateBreadcrumbs = (): BreadcrumbItem[] => {
		const pathSegments = location.pathname.split("/").filter(Boolean);
		const breadcrumbs: BreadcrumbItem[] = [];
		
		// Always start with home
		breadcrumbs.push({ label: "Home", href: "/" });
		
		// Build breadcrumbs from path segments
		let currentPath = "";
		pathSegments.forEach((segment, index) => {
			currentPath += `/${segment}`;
			const label = routeMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
			
			// Don't add href to the last item (current page)
			const href = index === pathSegments.length - 1 ? undefined : currentPath;
			
			breadcrumbs.push({ label, href });
		});
		
		return breadcrumbs;
	};

	const breadcrumbs = generateBreadcrumbs();

	// Don't show breadcrumbs if only home/admin
	if (breadcrumbs.length <= 2) return null;

	return (
		<nav className="bg-gray-50 border-b border-gray-200 px-4 py-2">
			<ol className="flex items-center space-x-2 text-sm">
				{breadcrumbs.map((breadcrumb, index) => (
					<li key={index} className="flex items-center">
						{index > 0 && (
							<ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
						)}
						
						{index === 0 && (
							<Home className="h-4 w-4 mr-2 text-gray-500" />
						)}
						
						{breadcrumb.href ? (
							<Link
								to={breadcrumb.href}
								className="text-gray-600 hover:text-gray-900 transition-colors"
							>
								{breadcrumb.label}
							</Link>
						) : (
							<span className="text-gray-900 font-medium">
								{breadcrumb.label}
							</span>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}
```

## Admin Page Components

### File: `app/components/admin/admin-dashboard.tsx`

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
	AlertTriangle
} from "lucide-react";
import { LoadingSpinner } from "~/components/ui/loading-spinner";

export function AdminDashboard() {
	// These will be implemented when tRPC procedures are available
	const { data: competitions, isLoading: competitionsLoading } = trpc.competitions.list.useQuery({ limit: 5 });
	const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery();

	const isLoading = competitionsLoading || statsLoading;

	const quickStats = [
		{
			title: "Active Competitions",
			value: stats?.activeCompetitions || 0,
			icon: Trophy,
			color: "text-blue-600",
			bgColor: "bg-blue-50",
		},
		{
			title: "Pending Photos",
			value: stats?.pendingPhotos || 0,
			icon: Clock,
			color: "text-orange-600",
			bgColor: "bg-orange-50",
		},
		{
			title: "Total Submissions",
			value: stats?.totalPhotos || 0,
			icon: Image,
			color: "text-green-600",
			bgColor: "bg-green-50",
		},
		{
			title: "Open Reports",
			value: stats?.openReports || 0,
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
				<h1 className="text-2xl font-bold text-gray-900">Welcome to Admin Dashboard</h1>
				<p className="text-gray-600">Manage your photo competitions and moderate content.</p>
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
										<p className="text-sm font-medium text-gray-600">{stat.title}</p>
										<p className="text-2xl font-bold text-gray-900">{stat.value}</p>
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
						{competitions && competitions.length > 0 ? (
							<div className="space-y-3">
								{competitions.slice(0, 5).map((competition) => (
									<div key={competition.id} className="flex items-center justify-between p-3 border rounded-lg">
										<div>
											<h4 className="font-medium">{competition.title}</h4>
											<p className="text-sm text-gray-500">
												{new Date(competition.createdAt).toLocaleDateString()}
											</p>
										</div>
										<Badge 
											variant={competition.status === "active" ? "default" : "secondary"}
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
									<Link to="/admin/competitions/new">Create First Competition</Link>
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
```

## Placeholder Admin Pages

### File: `app/routes/admin._index.tsx`

```typescript
import { AdminDashboard } from "~/components/admin/admin-dashboard";

export default function AdminIndexPage() {
	return <AdminDashboard />;
}

export function meta() {
	return [
		{ title: "Admin Dashboard - WDA Photo Competition" },
		{ name: "description", content: "Administrative dashboard for managing photo competitions" },
	];
}
```

### File: `app/routes/admin.competitions._index.tsx`

```typescript
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";

export default function AdminCompetitionsPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Competition Management</h1>
					<p className="text-gray-600">Create and manage photo competitions</p>
				</div>
				<Button>
					<Plus className="h-4 w-4 mr-2" />
					New Competition
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Competitions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-12 text-gray-500">
						<p>Competition management will be implemented in Phase 2</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export function meta() {
	return [
		{ title: "Competitions - Admin Dashboard" },
		{ name: "description", content: "Manage photo competitions" },
	];
}
```

### File: `app/routes/admin.moderation._index.tsx`

```typescript
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";

export default function AdminModerationPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Photo Moderation</h1>
				<p className="text-gray-600">Review and moderate photo submissions</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Moderation Queue</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-12 text-gray-500">
						<p>Photo moderation will be implemented in Phase 5</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export function meta() {
	return [
		{ title: "Photo Moderation - Admin Dashboard" },
		{ name: "description", content: "Moderate photo submissions" },
	];
}
```

## Mobile Responsiveness

### File: `app/components/admin/mobile-admin-nav.tsx`

```typescript
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { AdminSidebar } from "./admin-sidebar";

export function MobileAdminNav() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="lg:hidden">
			<Button
				variant="ghost"
				size="sm"
				onClick={() => setIsOpen(true)}
				className="fixed top-4 left-4 z-50"
			>
				<Menu className="h-5 w-5" />
			</Button>

			<AdminSidebar
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
			/>
		</div>
	);
}
```

## Success Criteria
- [ ] Admin layout renders correctly
- [ ] Sidebar navigation working with role-based filtering
- [ ] Admin header displays user info and actions
- [ ] Breadcrumb navigation functional
- [ ] Mobile responsiveness working
- [ ] Placeholder admin pages created
- [ ] Role-based access control enforced
- [ ] Admin dashboard displays stats (when available)
- [ ] Quick actions navigation working

## Dependencies
- Task 4: Role-based Middleware
- UI components (Card, Button, Badge, etc.)
- React Router for navigation
- Tailwind CSS for styling

## Estimated Time
**1.5 days**

## Next Task
Task 6: Route Protection - Implement comprehensive route protection for the entire application