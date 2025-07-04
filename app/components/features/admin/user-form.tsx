import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
import type { User } from "~/../../api/database/schema";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { useAuth } from "~/hooks/use-auth";
import {
	useAssignRole,
	useRoleInfo,
	useUpdateUser,
} from "~/hooks/use-user-management";
import type { UserRole } from "~/types/auth";

const userFormSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name is too long"),
	email: z.string().email("Invalid email address"),
	roles: z.enum(["user", "admin", "superadmin"]),
	emailVerified: z.boolean(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
	user: User;
	mode: "edit";
}

export function UserForm({ user, mode }: UserFormProps) {
	const navigate = useNavigate();
	const { user: currentUser, hasRole } = useAuth();
	const { data: roleInfo } = useRoleInfo();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setValue,
		watch,
	} = useForm<UserFormData>({
		resolver: zodResolver(userFormSchema),
		defaultValues: {
			name: user.name,
			email: user.email,
			roles: user.roles,
			emailVerified: user.emailVerified,
		},
	});

	const updateMutation = useUpdateUser();
	const assignRoleMutation = useAssignRole();

	const selectedRole = watch("roles");
	const canModifyRoles = hasRole("superadmin");
	const isSelfEdit = currentUser?.id === user.id;

	// Prevent self-modification
	useEffect(() => {
		if (isSelfEdit) {
			navigate("/admin/users", { replace: true });
		}
	}, [isSelfEdit, navigate]);

	const onSubmit = async (data: UserFormData) => {
		try {
			// If role changed, use assignRole mutation (SuperAdmin only)
			if (data.roles !== user.roles) {
				if (!canModifyRoles) {
					throw new Error("SuperAdmin role required to change user roles");
				}
				await assignRoleMutation.mutateAsync({
					userId: user.id,
					role: data.roles,
				});
			}

			// Update other user details
			const updateData: Partial<UserFormData> = {};
			if (data.name !== user.name) updateData.name = data.name;
			if (data.email !== user.email) updateData.email = data.email;
			if (data.emailVerified !== user.emailVerified)
				updateData.emailVerified = data.emailVerified;

			if (Object.keys(updateData).length > 0) {
				await updateMutation.mutateAsync({
					id: user.id,
					data: updateData,
				});
			}

			navigate("/admin/users");
		} catch (error) {
			// Error handling is done in mutation callbacks
		}
	};

	const getRoleBadge = (role: UserRole) => {
		switch (role) {
			case "superadmin":
				return <Badge variant="destructive">Super Admin</Badge>;
			case "admin":
				return <Badge variant="secondary">Admin</Badge>;
			case "user":
				return <Badge variant="outline">User</Badge>;
			default:
				return <Badge variant="outline">{role}</Badge>;
		}
	};

	const getRoleDescription = (role: UserRole) => {
		const roleData = roleInfo?.roles.find((r) => r.name === role);
		return roleData?.description || "";
	};

	if (isSelfEdit) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="text-center text-red-600">
						<p>You cannot modify your own account</p>
						<Button
							variant="outline"
							onClick={() => navigate("/admin/users")}
							className="mt-4"
						>
							Back to Users
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center gap-3">
					Edit User: {user.name}
					{getRoleBadge(user.roles)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					{/* User Details */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Name */}
						<div>
							<label
								htmlFor="name"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Name *
							</label>
							<Input
								id="name"
								{...register("name")}
								className={errors.name ? "border-red-500" : ""}
							/>
							{errors.name && (
								<p className="text-red-500 text-sm mt-1">
									{errors.name.message}
								</p>
							)}
						</div>

						{/* Email */}
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Email *
							</label>
							<Input
								id="email"
								type="email"
								{...register("email")}
								className={errors.email ? "border-red-500" : ""}
							/>
							{errors.email && (
								<p className="text-red-500 text-sm mt-1">
									{errors.email.message}
								</p>
							)}
						</div>
					</div>

					{/* Email Verification */}
					<div className="flex items-center gap-3">
						<input
							id="emailVerified"
							type="checkbox"
							{...register("emailVerified")}
							className="rounded border-gray-300"
						/>
						<label
							htmlFor="emailVerified"
							className="text-sm font-medium text-gray-700"
						>
							Email Verified
						</label>
					</div>

					{/* Role Selection */}
					<div>
						<label
							htmlFor="roles"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Role *
						</label>
						<select
							id="roles"
							{...register("roles")}
							disabled={!canModifyRoles}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
						>
							<option value="user">User</option>
							<option value="admin">Admin</option>
							<option value="superadmin">Super Admin</option>
						</select>
						{errors.roles && (
							<p className="text-red-500 text-sm mt-1">
								{errors.roles.message}
							</p>
						)}
						{!canModifyRoles && (
							<p className="text-orange-600 text-sm mt-1">
								⚠️ SuperAdmin role required to change user roles
							</p>
						)}
						{selectedRole && (
							<p className="text-gray-600 text-sm mt-1">
								{getRoleDescription(selectedRole)}
							</p>
						)}
					</div>

					{/* Role Change Warning */}
					{selectedRole !== user.roles && canModifyRoles && (
						<div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
							<p className="text-yellow-800 text-sm">
								⚠️ You are about to change this user's role from{" "}
								<strong>{user.roles}</strong> to <strong>{selectedRole}</strong>
								. This will affect their permissions immediately.
							</p>
						</div>
					)}

					{/* Form Actions */}
					<div className="flex items-center justify-between pt-6 border-t">
						<Button
							type="button"
							variant="outline"
							onClick={() => navigate("/admin/users")}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={
								isSubmitting ||
								updateMutation.isPending ||
								assignRoleMutation.isPending
							}
							className="min-w-24"
						>
							{isSubmitting ||
							updateMutation.isPending ||
							assignRoleMutation.isPending ? (
								<LoadingSpinner className="h-4 w-4" />
							) : (
								"Update User"
							)}
						</Button>
					</div>

					{/* Error Messages */}
					{(updateMutation.error || assignRoleMutation.error) && (
						<div className="bg-red-50 border border-red-200 rounded-md p-4">
							<p className="text-red-600 text-sm">
								{updateMutation.error?.message ||
									assignRoleMutation.error?.message}
							</p>
						</div>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
