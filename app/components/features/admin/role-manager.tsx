import { Shield, ShieldCheck, User } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { useRoleInfo } from "~/hooks/use-user-management";

export function RoleManager() {
	const { data: roleInfo, isLoading, error } = useRoleInfo();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-32">
				<LoadingSpinner />
			</div>
		);
	}

	if (error || !roleInfo) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="text-center text-red-600">
						<p>Failed to load role information</p>
						<p className="text-sm text-gray-500 mt-1">{error?.message}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const getRoleIcon = (level: number) => {
		switch (level) {
			case 1:
				return <User className="h-6 w-6 text-blue-600" />;
			case 2:
				return <Shield className="h-6 w-6 text-purple-600" />;
			case 3:
				return <ShieldCheck className="h-6 w-6 text-red-600" />;
			default:
				return <User className="h-6 w-6 text-gray-600" />;
		}
	};

	const getRoleBadge = (name: string) => {
		switch (name) {
			case "superadmin":
				return <Badge variant="destructive">Super Admin</Badge>;
			case "admin":
				return <Badge variant="secondary">Admin</Badge>;
			case "user":
				return <Badge variant="outline">User</Badge>;
			default:
				return <Badge variant="outline">{name}</Badge>;
		}
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Role Hierarchy</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-gray-600 mb-6">
						The system uses a hierarchical role structure where higher roles
						inherit all permissions from lower roles.
					</p>

					<div className="space-y-4">
						{roleInfo.roles.map((role) => (
							<Card key={role.name} className="border-l-4 border-l-blue-500">
								<CardContent className="p-4">
									<div className="flex items-start gap-4">
										{getRoleIcon(role.level)}
										<div className="flex-1">
											<div className="flex items-center gap-3 mb-2">
												{getRoleBadge(role.name)}
												<span className="text-sm text-gray-500">
													Level {role.level}
												</span>
											</div>
											<h3 className="font-semibold text-lg mb-2">
												{role.label}
											</h3>
											<p className="text-gray-600 mb-4">{role.description}</p>

											<div>
												<h4 className="font-medium text-sm text-gray-700 mb-2">
													Permissions:
												</h4>
												<div className="flex flex-wrap gap-2">
													{role.permissions.map((permission) => (
														<Badge
															key={permission}
															variant="outline"
															className="text-xs"
														>
															{permission.replace(/_/g, " ")}
														</Badge>
													))}
												</div>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Role Assignment Guidelines</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="bg-blue-50 border border-blue-200 rounded-md p-4">
							<h4 className="font-medium text-blue-900 mb-2">👤 User Role</h4>
							<p className="text-blue-800 text-sm">
								Default role for all registered users.
							</p>
						</div>

						<div className="bg-purple-50 border border-purple-200 rounded-md p-4">
							<h4 className="font-medium text-purple-900 mb-2">🛡️ Admin Role</h4>
							<p className="text-purple-800 text-sm">
								Moderators with additional permissions to manage competitions,
								moderate content, and view reports. Cannot modify user roles.
							</p>
						</div>

						<div className="bg-red-50 border border-red-200 rounded-md p-4">
							<h4 className="font-medium text-red-900 mb-2">
								🛡️✅ Super Admin Role
							</h4>
							<p className="text-red-800 text-sm">
								Full system access including user management and role
								assignment. Use sparingly and only for trusted administrators.
							</p>
						</div>
					</div>

					<div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
						<h4 className="font-medium text-yellow-900 mb-2">
							⚠️ Important Security Notes
						</h4>
						<ul className="text-yellow-800 text-sm space-y-1">
							<li>• Only SuperAdmins can assign or modify user roles</li>
							<li>• Users cannot modify their own roles</li>
							<li>• SuperAdmins cannot modify other SuperAdmin accounts</li>
							<li>• Role changes take effect immediately</li>
							<li>• Always verify user identity before role assignment</li>
						</ul>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
