import { ArrowDown, ArrowUp, Save, User } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import {
	useDemoteUser,
	usePromoteUser,
	useUpdateUser,
	useUser,
} from "~/hooks/use-user-management";
import type { UserRole } from "~/types/auth";

interface UserFormProps {
	mode: "edit";
	userId?: string;
}

export function UserForm({ userId }: UserFormProps) {
	const { data: user, isLoading } = useUser(userId || "", !!userId);
	const updateUser = useUpdateUser();
	const promoteUser = usePromoteUser();
	const demoteUser = useDemoteUser();
	const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-32">
				<LoadingSpinner />
			</div>
		);
	}

	if (!user) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="text-center text-red-600">
						<p>User not found</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const currentRoles = (
		Array.isArray(user.roles) ? user.roles : [user.roles]
	) as UserRole[];
	const effectiveRoles =
		selectedRoles.length > 0 ? selectedRoles : currentRoles;

	const handleRoleToggle = (role: UserRole) => {
		const newRoles = effectiveRoles.includes(role)
			? effectiveRoles.filter((r) => r !== role)
			: [...effectiveRoles, role];

		// Always include "user" role as base
		if (!newRoles.includes("user")) {
			newRoles.push("user");
		}

		setSelectedRoles(newRoles as UserRole[]);
	};

	const handleSaveRoles = () => {
		if (!userId) return;
		updateUser.mutate({
			userId,
			roles: effectiveRoles,
		});
	};

	const handlePromote = () => {
		if (!userId) return;
		promoteUser.mutate(userId);
	};

	const handleDemote = () => {
		if (!userId) return;
		demoteUser.mutate(userId);
	};

	const canPromote = !currentRoles.includes("superadmin");
	const canDemote =
		currentRoles.includes("admin") || currentRoles.includes("superadmin");

	return (
		<div className="space-y-6">
			{/* User Info Card */}
			<Card>
				<CardHeader>
					<CardTitle>User Information</CardTitle>
					<CardDescription>View and manage user details</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-center gap-4">
							{user.image ? (
								<img
									src={user.image}
									alt={user.name}
									className="h-16 w-16 rounded-full"
								/>
							) : (
								<div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
									<User className="h-8 w-8 text-gray-500" />
								</div>
							)}
							<div>
								<h3 className="text-lg font-semibold">{user.name}</h3>
								<p className="text-gray-600">{user.email}</p>
								<p className="text-sm text-gray-500">
									Joined: {new Date(user.createdAt).toLocaleDateString()}
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Role Management Card */}
			<Card>
				<CardHeader>
					<CardTitle>Role Management</CardTitle>
					<CardDescription>Manage user roles and permissions</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						{/* Current Roles */}
						<div>
							<h4 className="text-sm font-medium mb-3">Current Roles</h4>
							<div className="flex gap-2">
								{currentRoles.map((role) => (
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

						{/* Role Selection */}
						<div>
							<h4 className="text-sm font-medium mb-3">Assign Roles</h4>
							<div className="space-y-2">
								<label className="flex items-center gap-3">
									<input
										type="checkbox"
										checked={effectiveRoles.includes("user")}
										onChange={() => handleRoleToggle("user")}
										disabled
										className="rounded"
									/>
									<span className="text-sm">
										User (Base role - always active)
									</span>
								</label>
								<label className="flex items-center gap-3">
									<input
										type="checkbox"
										checked={effectiveRoles.includes("admin")}
										onChange={() => handleRoleToggle("admin")}
										className="rounded"
									/>
									<span className="text-sm">
										Admin (Can manage todos and view users)
									</span>
								</label>
								<label className="flex items-center gap-3">
									<input
										type="checkbox"
										checked={effectiveRoles.includes("superadmin")}
										onChange={() => handleRoleToggle("superadmin")}
										className="rounded"
									/>
									<span className="text-sm">
										Super Admin (Full system access)
									</span>
								</label>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3">
							<Button
								onClick={handleSaveRoles}
								disabled={
									updateUser.isLoading ||
									JSON.stringify(selectedRoles.sort()) ===
										JSON.stringify(currentRoles.sort())
								}
							>
								{updateUser.isLoading ? (
									<LoadingSpinner />
								) : (
									<>
										<Save className="h-4 w-4 mr-2" />
										Save Roles
									</>
								)}
							</Button>

							{canPromote && (
								<Button
									onClick={handlePromote}
									variant="outline"
									disabled={promoteUser.isLoading}
								>
									{promoteUser.isLoading ? (
										<LoadingSpinner />
									) : (
										<>
											<ArrowUp className="h-4 w-4 mr-2" />
											Promote
										</>
									)}
								</Button>
							)}

							{canDemote && (
								<Button
									onClick={handleDemote}
									variant="outline"
									disabled={demoteUser.isLoading}
								>
									{demoteUser.isLoading ? (
										<LoadingSpinner />
									) : (
										<>
											<ArrowDown className="h-4 w-4 mr-2" />
											Demote
										</>
									)}
								</Button>
							)}
						</div>

						{/* Error Messages */}
						{(updateUser.error || promoteUser.error || demoteUser.error) && (
							<div className="text-red-600 text-sm">
								{updateUser.error?.message ||
									promoteUser.error?.message ||
									demoteUser.error?.message}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Security Notice */}
			<Card>
				<CardHeader>
					<CardTitle>Important Notes</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="text-sm text-gray-600 space-y-2">
						<li>• Role changes take effect immediately</li>
						<li>
							• Users will need to refresh their session to see new permissions
						</li>
						<li>
							• Super Admin role grants full system access - use carefully
						</li>
						<li>• Changes are synced with Clerk's user metadata</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
