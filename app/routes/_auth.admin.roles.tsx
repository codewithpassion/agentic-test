import { CheckCircle, XCircle } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import type { UserRole } from "~/contexts/auth-context";
import { useAuth } from "~/hooks/use-auth";
import {
	type PERMISSIONS,
	PERMISSION_GROUPS,
	getPermissionDescription,
} from "~/lib/permissions";
import type { Route } from "./+types/_auth.admin.roles";

export function meta() {
	return [
		{ title: "Role & Permission Management" },
		{
			name: "description",
			content: "View and manage user roles and permissions",
		},
	];
}

export default function AdminRolesPage() {
	const auth = useAuth();

	if (!auth.hasPermission("admin.access")) {
		return (
			<div className="p-8">
				<p className="text-red-600">
					You don't have permission to access this page.
				</p>
			</div>
		);
	}

	// Remove unused variable since permissions is a private property
	// We can use hasPermission method instead

	return (
		<div className="p-8 space-y-8">
			<div>
				<h1 className="text-3xl font-bold">Role & Permission Management</h1>
				<p className="text-muted-foreground mt-2">
					View your current roles and permissions in the system
				</p>
			</div>

			{/* Current User Info */}
			<Card>
				<CardHeader>
					<CardTitle>Your Account</CardTitle>
					<CardDescription>
						Your current roles and permission level
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div>
							<p className="text-sm font-medium mb-2">Email</p>
							<p className="text-muted-foreground">{auth.user?.email}</p>
						</div>

						<div>
							<p className="text-sm font-medium mb-2">Roles</p>
							<div className="flex gap-2">
								{auth.user?.roles.map((role: UserRole) => (
									<Badge
										key={role}
										variant={
											role === "superadmin"
												? "destructive"
												: role === "admin"
													? "default"
													: "secondary"
										}
									>
										{role}
									</Badge>
								))}
							</div>
						</div>

						<div>
							<p className="text-sm font-medium mb-2">Permission Level</p>
							<p className="text-muted-foreground">
								{auth.isSuperAdmin()
									? "Full System Access"
									: auth.isAdmin()
										? "Administrative Access"
										: "Standard User Access"}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Permission Groups */}
			<div className="space-y-6">
				<h2 className="text-2xl font-semibold">Your Permissions</h2>

				{Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => (
					<Card key={groupName}>
						<CardHeader>
							<CardTitle className="text-lg">{groupName}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-3">
								{permissions.map((permission) => {
									const hasPermission = auth.hasPermission(
										permission as keyof typeof PERMISSIONS,
									);
									return (
										<div
											key={permission}
											className="flex items-center justify-between p-3 rounded-lg border"
										>
											<div className="space-y-1">
												<p className="font-mono text-sm">{permission}</p>
												<p className="text-sm text-muted-foreground">
													{getPermissionDescription(
														permission as keyof typeof PERMISSIONS,
													)}
												</p>
											</div>
											<div>
												{hasPermission ? (
													<CheckCircle className="h-5 w-5 text-green-600" />
												) : (
													<XCircle className="h-5 w-5 text-muted-foreground" />
												)}
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Role Hierarchy Info */}
			<Card>
				<CardHeader>
					<CardTitle>Role Hierarchy</CardTitle>
					<CardDescription>Understanding the role structure</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="p-4 border rounded-lg">
							<div className="flex items-center gap-3 mb-2">
								<Badge variant="secondary">user</Badge>
								<span className="text-sm font-medium">Basic User</span>
							</div>
							<p className="text-sm text-muted-foreground">
								Can manage their own todos and profile
							</p>
						</div>

						<div className="p-4 border rounded-lg">
							<div className="flex items-center gap-3 mb-2">
								<Badge variant="default">admin</Badge>
								<span className="text-sm font-medium">Administrator</span>
							</div>
							<p className="text-sm text-muted-foreground">
								Can manage users, view all todos, and access admin dashboard
							</p>
						</div>

						<div className="p-4 border rounded-lg">
							<div className="flex items-center gap-3 mb-2">
								<Badge variant="destructive">superadmin</Badge>
								<span className="text-sm font-medium">Super Administrator</span>
							</div>
							<p className="text-sm text-muted-foreground">
								Full system access including role management and system
								configuration
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Admin Actions */}
			{auth.hasPermission("users.manage_roles") && (
				<Card>
					<CardHeader>
						<CardTitle>Admin Actions</CardTitle>
						<CardDescription>
							Available administrative functions
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							To manage user roles programmatically, use the server-side
							functions in{" "}
							<code className="font-mono">app/lib/clerk-admin.server.ts</code>
						</p>
						<div className="mt-4 p-4 bg-muted rounded-lg">
							<p className="text-sm font-mono">
								Note: Role updates must be done server-side for security. Create
								server actions or API routes to call the admin functions.
							</p>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
