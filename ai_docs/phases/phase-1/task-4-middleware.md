# Task 4: Role-based Middleware

## Overview
Implement comprehensive middleware for route protection, authentication checking, and role-based UI rendering throughout the application.

## Goals
- Create React Router middleware for route protection
- Implement role-based component guards
- Set up authentication context providers
- Create utility components for conditional rendering
- Establish error boundaries for auth failures

## Authentication Context

### File: `app/contexts/auth-context.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "better-auth/react";
import { AuthUser, UserRole, Permission } from "~~packages/better-auth/types";
import { hasPermission, hasRole, isAdmin, isSuperAdmin } from "~~packages/better-auth/permissions";

interface AuthContextType {
	user: AuthUser | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	hasPermission: (permission: Permission) => boolean;
	hasRole: (role: UserRole) => boolean;
	isAdmin: () => boolean;
	isSuperAdmin: () => boolean;
	canPerformAction: (permission: Permission, resourceUserId?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
	children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const { data: session, isPending } = useSession();
	const user = session?.user as AuthUser | null;

	const contextValue: AuthContextType = {
		user,
		isLoading: isPending,
		isAuthenticated: !!user,
		hasPermission: (permission: Permission) => hasPermission(user, permission),
		hasRole: (role: UserRole) => hasRole(user, role),
		isAdmin: () => isAdmin(user),
		isSuperAdmin: () => isSuperAdmin(user),
		canPerformAction: (permission: Permission, resourceUserId?: string) => {
			if (!user) return false;
			if (!hasPermission(user, permission)) return false;
			if (resourceUserId && resourceUserId !== user.id) {
				return isAdmin(user);
			}
			return true;
		},
	};

	return (
		<AuthContext.Provider value={contextValue}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}

// Convenience hooks
export function useAuthUser() {
	const { user } = useAuth();
	return user;
}

export function useIsAuthenticated() {
	const { isAuthenticated } = useAuth();
	return isAuthenticated;
}

export function useIsAdmin() {
	const { isAdmin } = useAuth();
	return isAdmin();
}

export function usePermissions() {
	const { hasPermission, hasRole, canPerformAction } = useAuth();
	return { hasPermission, hasRole, canPerformAction };
}
```

## Route Protection Components

### File: `app/components/auth/protected-route.tsx`

```typescript
import { useAuth } from "~/contexts/auth-context";
import { UserRole, Permission } from "~~packages/better-auth/types";
import { Navigate, useLocation } from "react-router";
import { LoadingSpinner } from "~/components/ui/loading-spinner";

interface ProtectedRouteProps {
	children: React.ReactNode;
	requireAuth?: boolean;
	requiredRole?: UserRole;
	requiredPermission?: Permission;
	fallback?: React.ReactNode;
	redirectTo?: string;
}

export function ProtectedRoute({
	children,
	requireAuth = true,
	requiredRole,
	requiredPermission,
	fallback,
	redirectTo = "/login",
}: ProtectedRouteProps) {
	const { user, isLoading, hasRole, hasPermission } = useAuth();
	const location = useLocation();

	// Show loading spinner while checking authentication
	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	// Check authentication requirement
	if (requireAuth && !user) {
		return (
			<Navigate
				to={redirectTo}
				state={{ from: location.pathname }}
				replace
			/>
		);
	}

	// Check role requirement
	if (requiredRole && !hasRole(requiredRole)) {
		if (fallback) {
			return <>{fallback}</>;
		}
		return (
			<Navigate
				to="/unauthorized"
				state={{ requiredRole, from: location.pathname }}
				replace
			/>
		);
	}

	// Check permission requirement
	if (requiredPermission && !hasPermission(requiredPermission)) {
		if (fallback) {
			return <>{fallback}</>;
		}
		return (
			<Navigate
				to="/unauthorized"
				state={{ requiredPermission, from: location.pathname }}
				replace
			/>
		);
	}

	return <>{children}</>;
}

// Convenience components for common protection patterns
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, "requiredRole">) {
	return (
		<ProtectedRoute requiredRole="admin" {...props}>
			{children}
		</ProtectedRoute>
	);
}

export function SuperAdminRoute({ children, ...props }: Omit<ProtectedRouteProps, "requiredRole">) {
	return (
		<ProtectedRoute requiredRole="superadmin" {...props}>
			{children}
		</ProtectedRoute>
	);
}

export function ModeratorRoute({ children, ...props }: Omit<ProtectedRouteProps, "requiredPermission">) {
	return (
		<ProtectedRoute requiredPermission="moderate_content" {...props}>
			{children}
		</ProtectedRoute>
	);
}
```

### File: `app/components/auth/role-guard.tsx`

```typescript
import { useAuth } from "~/contexts/auth-context";
import { UserRole, Permission } from "~~packages/better-auth/types";

interface RoleGuardProps {
	children: React.ReactNode;
	role?: UserRole;
	permission?: Permission;
	fallback?: React.ReactNode;
	inverse?: boolean; // Show children when user DOESN'T have role/permission
}

export function RoleGuard({
	children,
	role,
	permission,
	fallback = null,
	inverse = false,
}: RoleGuardProps) {
	const { hasRole, hasPermission } = useAuth();

	let hasAccess = true;

	if (role) {
		hasAccess = hasRole(role);
	}

	if (permission) {
		hasAccess = hasAccess && hasPermission(permission);
	}

	// Invert the logic if inverse is true
	if (inverse) {
		hasAccess = !hasAccess;
	}

	return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Convenience components
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
	return (
		<RoleGuard role="admin" fallback={fallback}>
			{children}
		</RoleGuard>
	);
}

export function SuperAdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
	return (
		<RoleGuard role="superadmin" fallback={fallback}>
			{children}
		</RoleGuard>
	);
}

export function UserOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
	return (
		<RoleGuard role="user" inverse fallback={fallback}>
			{children}
		</RoleGuard>
	);
}

export function PermissionGuard({
	permission,
	children,
	fallback,
}: {
	permission: Permission;
	children: React.ReactNode;
	fallback?: React.ReactNode;
}) {
	return (
		<RoleGuard permission={permission} fallback={fallback}>
			{children}
		</RoleGuard>
	);
}
```

## Navigation Middleware

### File: `app/components/auth/conditional-nav.tsx`

```typescript
import { useAuth } from "~/contexts/auth-context";
import { UserRole } from "~~packages/better-auth/types";

interface NavItem {
	label: string;
	href: string;
	role?: UserRole;
	permission?: string;
	icon?: React.ReactNode;
}

interface ConditionalNavProps {
	items: NavItem[];
	className?: string;
	renderItem: (item: NavItem, isVisible: boolean) => React.ReactNode;
}

export function ConditionalNav({ items, renderItem }: ConditionalNavProps) {
	const { hasRole, hasPermission } = useAuth();

	return (
		<>
			{items.map((item) => {
				let isVisible = true;

				// Check role requirement
				if (item.role && !hasRole(item.role)) {
					isVisible = false;
				}

				// Check permission requirement
				if (item.permission && !hasPermission(item.permission as any)) {
					isVisible = false;
				}

				return renderItem(item, isVisible);
			})}
		</>
	);
}

// Admin navigation items
export const adminNavItems: NavItem[] = [
	{
		label: "Dashboard",
		href: "/admin",
		role: "admin",
	},
	{
		label: "Competitions",
		href: "/admin/competitions",
		permission: "manage_competitions",
	},
	{
		label: "Photo Moderation",
		href: "/admin/moderation",
		permission: "moderate_content",
	},
	{
		label: "Reports",
		href: "/admin/reports",
		permission: "view_reports",
	},
	{
		label: "Users",
		href: "/admin/users",
		role: "superadmin",
	},
];

// User navigation items
export const userNavItems: NavItem[] = [
	{
		label: "Gallery",
		href: "/gallery",
	},
	{
		label: "Submit Photo",
		href: "/submit",
		permission: "submit_photo",
	},
	{
		label: "My Submissions",
		href: "/my-submissions",
		permission: "submit_photo",
	},
	{
		label: "Voting Stats",
		href: "/voting-stats",
		permission: "vote_photo",
	},
];
```

## Error Boundaries and Fallbacks

### File: `app/components/auth/auth-error-boundary.tsx`

```typescript
import { Component, ReactNode } from "react";
import { Button } from "~/components/ui/button";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Auth Error Boundary caught an error:", error, errorInfo);
		
		// Log to error reporting service
		// reportError(error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex flex-col items-center justify-center min-h-[400px] p-8">
					<h2 className="text-xl font-semibold mb-4">Authentication Error</h2>
					<p className="text-gray-600 mb-6 text-center max-w-md">
						There was an error with authentication. Please try refreshing the page or logging in again.
					</p>
					<div className="flex gap-4">
						<Button
							onClick={() => window.location.reload()}
							variant="outline"
						>
							Refresh Page
						</Button>
						<Button
							onClick={() => window.location.href = "/login"}
						>
							Go to Login
						</Button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
```

### File: `app/components/auth/unauthorized.tsx`

```typescript
import { useLocation, Link } from "react-router";
import { Button } from "~/components/ui/button";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";

export function UnauthorizedPage() {
	const location = useLocation();
	const state = location.state as {
		requiredRole?: string;
		requiredPermission?: string;
		from?: string;
	} | null;

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-8">
			<div className="text-center max-w-md">
				<AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-6" />
				
				<h1 className="text-2xl font-bold mb-4">Access Denied</h1>
				
				<p className="text-gray-600 mb-6">
					{state?.requiredRole && (
						<>You need <strong>{state.requiredRole}</strong> role to access this page.</>
					)}
					{state?.requiredPermission && (
						<>You don't have permission to access this page. Required permission: <strong>{state.requiredPermission}</strong></>
					)}
					{!state?.requiredRole && !state?.requiredPermission && (
						"You don't have permission to access this page."
					)}
				</p>

				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					{state?.from && (
						<Button asChild variant="outline">
							<Link to={state.from}>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Go Back
							</Link>
						</Button>
					)}
					
					<Button asChild>
						<Link to="/">
							<Home className="h-4 w-4 mr-2" />
							Go Home
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
```

## Loading States and Suspense

### File: `app/components/auth/auth-loader.tsx`

```typescript
import { Suspense } from "react";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { useAuth } from "~/contexts/auth-context";

interface AuthLoaderProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export function AuthLoader({ children, fallback }: AuthLoaderProps) {
	const { isLoading } = useAuth();

	if (isLoading) {
		return (
			fallback || (
				<div className="flex items-center justify-center min-h-screen">
					<LoadingSpinner size="lg" />
				</div>
			)
		);
	}

	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-screen">
					<LoadingSpinner size="lg" />
				</div>
			}
		>
			{children}
		</Suspense>
	);
}

// Higher-order component for adding auth loading to components
export function withAuthLoader<P extends object>(
	Component: React.ComponentType<P>,
	fallback?: React.ReactNode
) {
	return function AuthLoadedComponent(props: P) {
		return (
			<AuthLoader fallback={fallback}>
				<Component {...props} />
			</AuthLoader>
		);
	};
}
```

## Route Configuration with Protection

### File: `app/routes-config.tsx`

```typescript
import { RouteObject } from "react-router";
import { ProtectedRoute, AdminRoute, SuperAdminRoute } from "~/components/auth/protected-route";

// Lazy load route components
const HomePage = lazy(() => import("~/routes/home"));
const LoginPage = lazy(() => import("~/routes/login"));
const GalleryPage = lazy(() => import("~/routes/gallery"));
const SubmitPage = lazy(() => import("~/routes/submit"));
const AdminDashboard = lazy(() => import("~/routes/admin/dashboard"));
const CompetitionsPage = lazy(() => import("~/routes/admin/competitions"));
const ModerationPage = lazy(() => import("~/routes/admin/moderation"));
const UsersPage = lazy(() => import("~/routes/admin/users"));
const UnauthorizedPage = lazy(() => import("~/components/auth/unauthorized"));

export const protectedRoutes: RouteObject[] = [
	{
		path: "/",
		element: <HomePage />,
	},
	{
		path: "/login",
		element: <LoginPage />,
	},
	{
		path: "/unauthorized",
		element: <UnauthorizedPage />,
	},
	{
		path: "/gallery",
		element: <GalleryPage />,
	},
	{
		path: "/submit",
		element: (
			<ProtectedRoute requiredPermission="submit_photo">
				<SubmitPage />
			</ProtectedRoute>
		),
	},
	{
		path: "/my-submissions",
		element: (
			<ProtectedRoute requiredPermission="submit_photo">
				<MySubmissionsPage />
			</ProtectedRoute>
		),
	},
	{
		path: "/admin",
		element: (
			<AdminRoute>
				<AdminDashboard />
			</AdminRoute>
		),
		children: [
			{
				path: "competitions",
				element: (
					<ProtectedRoute requiredPermission="manage_competitions">
						<CompetitionsPage />
					</ProtectedRoute>
				),
			},
			{
				path: "moderation",
				element: (
					<ProtectedRoute requiredPermission="moderate_content">
						<ModerationPage />
					</ProtectedRoute>
				),
			},
			{
				path: "users",
				element: (
					<SuperAdminRoute>
						<UsersPage />
					</SuperAdminRoute>
				),
			},
		],
	},
];
```

## Utility Hooks for Common Patterns

### File: `app/hooks/use-auth-guard.ts`

```typescript
import { useAuth } from "~/contexts/auth-context";
import { UserRole, Permission } from "~~packages/better-auth/types";
import { useNavigate } from "react-router";
import { useEffect } from "react";

interface UseAuthGuardOptions {
	redirectTo?: string;
	requiredRole?: UserRole;
	requiredPermission?: Permission;
	onUnauthorized?: () => void;
}

export function useAuthGuard({
	redirectTo = "/login",
	requiredRole,
	requiredPermission,
	onUnauthorized,
}: UseAuthGuardOptions = {}) {
	const { user, isLoading, hasRole, hasPermission } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (isLoading) return;

		// Check if user is authenticated
		if (!user) {
			navigate(redirectTo, { replace: true });
			return;
		}

		// Check role requirement
		if (requiredRole && !hasRole(requiredRole)) {
			if (onUnauthorized) {
				onUnauthorized();
			} else {
				navigate("/unauthorized", { replace: true });
			}
			return;
		}

		// Check permission requirement
		if (requiredPermission && !hasPermission(requiredPermission)) {
			if (onUnauthorized) {
				onUnauthorized();
			} else {
				navigate("/unauthorized", { replace: true });
			}
			return;
		}
	}, [user, isLoading, hasRole, hasPermission, requiredRole, requiredPermission, navigate, redirectTo, onUnauthorized]);

	return {
		user,
		isLoading,
		isAuthorized: !!user && 
			(!requiredRole || hasRole(requiredRole)) && 
			(!requiredPermission || hasPermission(requiredPermission)),
	};
}

// Convenience hooks
export function useRequireAuth(redirectTo?: string) {
	return useAuthGuard({ redirectTo });
}

export function useRequireAdmin(redirectTo?: string) {
	return useAuthGuard({ requiredRole: "admin", redirectTo });
}

export function useRequireSuperAdmin(redirectTo?: string) {
	return useAuthGuard({ requiredRole: "superadmin", redirectTo });
}
```

## Success Criteria
- [ ] Authentication context provider working
- [ ] Route protection components functional
- [ ] Role-based guards working correctly
- [ ] Error boundaries handling auth failures
- [ ] Loading states implemented
- [ ] Navigation middleware filtering correctly
- [ ] Unauthorized page displays properly
- [ ] Auth hooks working as expected
- [ ] Type safety maintained throughout

## Dependencies
- Task 2: User Roles Extension
- React Router setup
- Better-auth client hooks
- UI components (LoadingSpinner, Button, etc.)

## Estimated Time
**1 day**

## Next Task
Task 5: Admin Layout Infrastructure - Create the admin interface shell and navigation