# Task 6: Route Protection

## Overview
Implement comprehensive route protection throughout the application, ensuring proper access control for all routes based on authentication status and user roles.

## Goals
- Configure React Router with role-based protection
- Implement route guards for all application sections
- Set up proper redirects and fallbacks
- Create error pages for unauthorized access
- Ensure seamless authentication flow

## Router Configuration

### File: `app/routes.ts`

```typescript
import type { RouteConfig } from "@react-router/dev/routes";

export default [
	// Public routes
	{
		index: true,
		file: "routes/_index.tsx",
	},
	{
		path: "/login",
		file: "routes/login._index.tsx",
	},
	{
		path: "/signup", 
		file: "routes/signup.tsx",
	},
	{
		path: "/verify",
		file: "routes/verify.tsx",
	},
	{
		path: "/logout",
		file: "routes/logout.tsx",
	},
	{
		path: "/unauthorized",
		file: "routes/unauthorized.tsx",
	},

	// Public gallery routes
	{
		path: "/gallery",
		file: "routes/gallery._index.tsx",
	},
	{
		path: "/gallery/:competitionId",
		file: "routes/gallery.$competitionId.tsx",
	},
	{
		path: "/results",
		file: "routes/results._index.tsx",
	},
	{
		path: "/results/:competitionId",
		file: "routes/results.$competitionId.tsx",
	},

	// Protected user routes
	{
		path: "/submit",
		file: "routes/_protected.submit._index.tsx",
	},
	{
		path: "/submit/:competitionId",
		file: "routes/_protected.submit.$competitionId.tsx",
	},
	{
		path: "/my-submissions",
		file: "routes/_protected.my-submissions.tsx",
	},
	{
		path: "/voting-stats",
		file: "routes/_protected.voting-stats.tsx",
	},

	// Admin routes
	{
		path: "/admin",
		file: "routes/_admin.tsx",
		children: [
			{
				index: true,
				file: "routes/_admin._index.tsx",
			},
			{
				path: "competitions",
				file: "routes/_admin.competitions._index.tsx",
			},
			{
				path: "competitions/new",
				file: "routes/_admin.competitions.new.tsx",
			},
			{
				path: "competitions/:id",
				file: "routes/_admin.competitions.$id.tsx",
			},
			{
				path: "competitions/:id/edit",
				file: "routes/_admin.competitions.$id.edit.tsx",
			},
			{
				path: "moderation",
				file: "routes/_admin.moderation._index.tsx",
			},
			{
				path: "moderation/pending",
				file: "routes/_admin.moderation.pending.tsx",
			},
			{
				path: "moderation/photos",
				file: "routes/_admin.moderation.photos.tsx",
			},
			{
				path: "reports",
				file: "routes/_admin.reports.tsx",
			},
			{
				path: "users",
				file: "routes/_admin.users._index.tsx",
			},
			{
				path: "users/:id",
				file: "routes/_admin.users.$id.tsx",
			},
			{
				path: "settings",
				file: "routes/_admin.settings.tsx",
			},
		],
	},

	// Catch-all for 404
	{
		path: "*",
		file: "routes/404.tsx",
	},
] satisfies RouteConfig;
```

## Protected Layout Components

### File: `app/routes/_protected.tsx`

```typescript
import { Outlet } from "react-router";
import { ProtectedRoute } from "~/components/auth/protected-route";
import { AppLayout } from "~/components/app-layout";
import { AuthErrorBoundary } from "~/components/auth/auth-error-boundary";

export default function ProtectedLayout() {
	return (
		<AuthErrorBoundary>
			<ProtectedRoute>
				<AppLayout>
					<Outlet />
				</AppLayout>
			</ProtectedRoute>
		</AuthErrorBoundary>
	);
}

export function meta() {
	return [
		{ title: "WDA Photo Competition" },
		{ name: "description", content: "Wildlife Disease Association Photo Competition Platform" },
	];
}
```

### File: `app/routes/_admin.tsx`

```typescript
import { Outlet } from "react-router";
import { AdminRoute } from "~/components/auth/protected-route";
import { AdminLayout } from "~/components/admin/admin-layout";
import { AuthErrorBoundary } from "~/components/auth/auth-error-boundary";

export default function AdminLayoutRoute() {
	return (
		<AuthErrorBoundary>
			<AdminRoute>
				<AdminLayout>
					<Outlet />
				</AdminLayout>
			</AdminRoute>
		</AuthErrorBoundary>
	);
}

export function meta() {
	return [
		{ title: "Admin Dashboard - WDA Photo Competition" },
		{ name: "description", content: "Administrative dashboard for managing photo competitions" },
	];
}
```

## Authentication Route Handlers

### File: `app/routes/login._index.tsx`

```typescript
import { useAuth } from "~/contexts/auth-context";
import { Navigate, useLocation } from "react-router";
import { LoginForm } from "~/components/auth/login-form";
import { LoadingSpinner } from "~/components/ui/loading-spinner";

export default function LoginPage() {
	const { isAuthenticated, isLoading } = useAuth();
	const location = useLocation();
	
	// Get the redirect path from state or default to home
	const from = location.state?.from || "/";

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	// Redirect if already authenticated
	if (isAuthenticated) {
		return <Navigate to={from} replace />;
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
						Sign in to your account
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						Access the Wildlife Disease Association Photo Competition
					</p>
				</div>
				<LoginForm redirectTo={from} />
			</div>
		</div>
	);
}

export function meta() {
	return [
		{ title: "Login - WDA Photo Competition" },
		{ name: "description", content: "Sign in to participate in photo competitions" },
	];
}
```

### File: `app/routes/logout.tsx`

```typescript
import { useEffect } from "react";
import { Navigate } from "react-router";
import { signOut } from "better-auth/react";
import { LoadingSpinner } from "~/components/ui/loading-spinner";

export default function LogoutPage() {
	useEffect(() => {
		const handleLogout = async () => {
			try {
				await signOut();
			} catch (error) {
				console.error("Logout error:", error);
			}
		};

		handleLogout();
	}, []);

	// Show loading spinner briefly, then redirect
	setTimeout(() => {
		window.location.href = "/";
	}, 1000);

	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center">
				<LoadingSpinner size="lg" />
				<p className="mt-4 text-gray-600">Signing you out...</p>
			</div>
		</div>
	);
}

export function meta() {
	return [
		{ title: "Logging out..." },
	];
}
```

### File: `app/routes/unauthorized.tsx`

```typescript
import { UnauthorizedPage } from "~/components/auth/unauthorized";

export default function UnauthorizedRoute() {
	return <UnauthorizedPage />;
}

export function meta() {
	return [
		{ title: "Access Denied - WDA Photo Competition" },
		{ name: "description", content: "You don't have permission to access this page" },
	];
}
```

## Protected Route Examples

### File: `app/routes/_protected.submit._index.tsx`

```typescript
import { Link } from "react-router";
import { trpc } from "~/lib/trpc";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Trophy, Calendar, Users } from "lucide-react";
import { LoadingSpinner } from "~/components/ui/loading-spinner";

export default function SubmitIndexPage() {
	const { data: activeCompetition, isLoading } = trpc.competitions.getActive.useQuery();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-64">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (!activeCompetition) {
		return (
			<div className="max-w-2xl mx-auto">
				<Card>
					<CardContent className="text-center py-12">
						<Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
						<h2 className="text-xl font-semibold mb-2">No Active Competition</h2>
						<p className="text-gray-600 mb-6">
							There are currently no active photo competitions. Check back later or view past competitions.
						</p>
						<div className="flex gap-4 justify-center">
							<Button asChild variant="outline">
								<Link to="/gallery">View Gallery</Link>
							</Button>
							<Button asChild variant="outline">
								<Link to="/results">Past Results</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<div className="text-center">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Your Photos</h1>
				<p className="text-gray-600">
					Participate in the current photo competition
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Trophy className="h-5 w-5 text-yellow-500" />
						{activeCompetition.title}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<p className="text-gray-700">{activeCompetition.description}</p>
						
						<div className="flex flex-wrap gap-4 text-sm text-gray-600">
							{activeCompetition.startDate && (
								<div className="flex items-center gap-1">
									<Calendar className="h-4 w-4" />
									Started: {new Date(activeCompetition.startDate).toLocaleDateString()}
								</div>
							)}
							{activeCompetition.endDate && (
								<div className="flex items-center gap-1">
									<Calendar className="h-4 w-4" />
									Ends: {new Date(activeCompetition.endDate).toLocaleDateString()}
								</div>
							)}
						</div>

						<div className="pt-4">
							<Button asChild size="lg">
								<Link to={`/submit/${activeCompetition.id}`}>
									Choose Category & Submit
								</Link>
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export function meta() {
	return [
		{ title: "Submit Photos - WDA Photo Competition" },
		{ name: "description", content: "Submit your photos to the active competition" },
	];
}
```

### File: `app/routes/_protected.my-submissions.tsx`

```typescript
import { trpc } from "~/lib/trpc";
import { useAuth } from "~/contexts/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";
import { Camera, Edit, Trash2, Eye } from "lucide-react";
import { LoadingSpinner } from "~/components/ui/loading-spinner";

export default function MySubmissionsPage() {
	const { user } = useAuth();
	const { data: submissions, isLoading } = trpc.photos.getUserSubmissions.useQuery(
		{ userId: user?.id || "" },
		{ enabled: !!user?.id }
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-64">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
					<p className="text-gray-600">Manage your photo submissions</p>
				</div>
				<Button asChild>
					<Link to="/submit">
						<Camera className="h-4 w-4 mr-2" />
						Submit New Photo
					</Link>
				</Button>
			</div>

			{!submissions || submissions.length === 0 ? (
				<Card>
					<CardContent className="text-center py-12">
						<Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
						<h2 className="text-xl font-semibold mb-2">No Submissions Yet</h2>
						<p className="text-gray-600 mb-6">
							You haven't submitted any photos to competitions yet.
						</p>
						<Button asChild>
							<Link to="/submit">Submit Your First Photo</Link>
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{submissions.map((submission) => (
						<Card key={submission.id} className="overflow-hidden">
							<div className="aspect-video bg-gray-100 relative">
								{/* Photo thumbnail will be displayed here */}
								<div className="absolute inset-0 flex items-center justify-center">
									<Camera className="h-8 w-8 text-gray-400" />
								</div>
								<div className="absolute top-2 right-2">
									<Badge 
										variant={
											submission.status === "approved" ? "default" :
											submission.status === "rejected" ? "destructive" :
											"secondary"
										}
									>
										{submission.status}
									</Badge>
								</div>
							</div>
							
							<CardContent className="p-4">
								<h3 className="font-semibold truncate">{submission.title}</h3>
								<p className="text-sm text-gray-600 mt-1 line-clamp-2">
									{submission.description}
								</p>
								<p className="text-xs text-gray-500 mt-2">
									{new Date(submission.createdAt).toLocaleDateString()}
								</p>
								
								<div className="flex gap-2 mt-4">
									<Button size="sm" variant="outline" className="flex-1">
										<Eye className="h-4 w-4 mr-1" />
										View
									</Button>
									{submission.status === "pending" && (
										<>
											<Button size="sm" variant="outline">
												<Edit className="h-4 w-4" />
											</Button>
											<Button size="sm" variant="outline">
												<Trash2 className="h-4 w-4" />
											</Button>
										</>
									)}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}

export function meta() {
	return [
		{ title: "My Submissions - WDA Photo Competition" },
		{ name: "description", content: "View and manage your photo submissions" },
	];
}
```

## Error Pages

### File: `app/routes/404.tsx`

```typescript
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFoundPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full text-center">
				<div className="mb-8">
					<h1 className="text-9xl font-bold text-gray-200">404</h1>
					<h2 className="text-2xl font-bold text-gray-900 mt-4">Page Not Found</h2>
					<p className="text-gray-600 mt-2">
						The page you're looking for doesn't exist or has been moved.
					</p>
				</div>

				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					<Button asChild variant="outline">
						<button onClick={() => window.history.back()}>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Go Back
						</button>
					</Button>
					
					<Button asChild>
						<Link to="/">
							<Home className="h-4 w-4 mr-2" />
							Go Home
						</Link>
					</Button>
				</div>

				<div className="mt-8 pt-8 border-t border-gray-200">
					<p className="text-sm text-gray-500">
						Looking for something specific?
					</p>
					<div className="mt-2 flex gap-2 justify-center text-sm">
						<Link to="/gallery" className="text-blue-600 hover:underline">
							Photo Gallery
						</Link>
						<span className="text-gray-300">•</span>
						<Link to="/submit" className="text-blue-600 hover:underline">
							Submit Photos
						</Link>
						<span className="text-gray-300">•</span>
						<Link to="/results" className="text-blue-600 hover:underline">
							Competition Results
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export function meta() {
	return [
		{ title: "Page Not Found - WDA Photo Competition" },
		{ name: "description", content: "The page you're looking for doesn't exist" },
	];
}
```

## Root Layout with Providers

### File: `app/root.tsx`

```typescript
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	isRouteErrorResponse,
	useRouteError,
} from "react-router";
import type { LinksFunction } from "react-router";
import { AuthProvider } from "~/contexts/auth-context";
import { TRPCProvider } from "~/providers/trpc-provider";
import stylesheet from "./tailwind.css?url";

export const links: LinksFunction = () => [
	{ rel: "stylesheet", href: stylesheet },
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				<TRPCProvider>
					<AuthProvider>
						{children}
					</AuthProvider>
				</TRPCProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary() {
	const error = useRouteError();

	if (isRouteErrorResponse(error)) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">
						{error.status} {error.statusText}
					</h1>
					<p className="text-gray-600 mb-6">{error.data}</p>
					<button
						onClick={() => window.location.reload()}
						className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="text-center">
				<h1 className="text-4xl font-bold text-gray-900 mb-4">
					Something went wrong
				</h1>
				<p className="text-gray-600 mb-6">
					{error instanceof Error ? error.message : "An unexpected error occurred"}
				</p>
				<button
					onClick={() => window.location.reload()}
					className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
				>
					Reload Page
				</button>
			</div>
		</div>
	);
}
```

## Success Criteria
- [ ] All routes properly protected based on requirements
- [ ] Authentication redirects working correctly
- [ ] Admin routes only accessible to admin users
- [ ] Protected routes require authentication
- [ ] Error pages display appropriately
- [ ] 404 handling working correctly
- [ ] Loading states during authentication checks
- [ ] Seamless authentication flow
- [ ] Mobile-responsive error pages

## Dependencies
- Task 4: Role-based Middleware
- Task 5: Admin Layout Infrastructure
- React Router configuration
- Authentication context and hooks

## Estimated Time
**1 day**

## Next Task
Task 7: Admin Dashboard - Complete the admin dashboard with real statistics and functionality