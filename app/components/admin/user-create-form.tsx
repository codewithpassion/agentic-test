import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { useAuth } from "~/hooks/use-auth";
import { useCreateUser, useRoleInfo } from "~/hooks/use-user-management";
import type { UserRole } from "~/types/auth";

const createUserFormSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name is too long"),
	email: z.string().email("Invalid email address"),
	roles: z.enum(["user", "admin", "superadmin"]),
	emailVerified: z.boolean(),
});

type CreateUserFormData = z.infer<typeof createUserFormSchema>;

export function UserCreateForm() {
	const navigate = useNavigate();
	const { hasRole } = useAuth();
	const { data: roleInfo } = useRoleInfo();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		watch,
	} = useForm<CreateUserFormData>({
		resolver: zodResolver(createUserFormSchema),
		defaultValues: {
			name: "",
			email: "",
			roles: "user",
			emailVerified: false,
		},
	});

	const createMutation = useCreateUser();
	const selectedRole = watch("roles");
	const canCreateUsers = hasRole("superadmin");

	const onSubmit = async (data: CreateUserFormData) => {
		try {
			await createMutation.mutateAsync(data);
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

	if (!canCreateUsers) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="text-center text-red-600">
						<p>SuperAdmin role required to create users</p>
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
				<CardTitle>Create New User</CardTitle>
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
								placeholder="Enter full name"
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
								placeholder="Enter email address"
								className={errors.email ? "border-red-500" : ""}
							/>
							{errors.email && (
								<p className="text-red-500 text-sm mt-1">
									{errors.email.message}
								</p>
							)}
						</div>
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
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
						{selectedRole && (
							<div className="mt-2 flex items-center gap-2">
								{getRoleBadge(selectedRole)}
								<span className="text-gray-600 text-sm">
									{getRoleDescription(selectedRole)}
								</span>
							</div>
						)}
					</div>

					{/* Options */}
					<div className="space-y-3">
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
								Mark email as verified
							</label>
						</div>
					</div>

					{/* Information Box */}
					<div className="bg-blue-50 border border-blue-200 rounded-md p-4">
						<h4 className="font-medium text-blue-900 mb-2">
							ℹ️ About User Creation
						</h4>
						<ul className="text-blue-800 text-sm space-y-1">
							<li>
								• Created users will need to set up their password through the
								normal signup flow
							</li>
							<li>
								• If email verification is unchecked, users must verify their
								email
							</li>
							<li>
								• Users can change their profile details after first login
							</li>
							<li>
								• Role can be modified later from the user management panel
							</li>
						</ul>
					</div>

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
							disabled={isSubmitting || createMutation.isPending}
							className="min-w-24"
						>
							{isSubmitting || createMutation.isPending ? (
								<LoadingSpinner className="h-4 w-4" />
							) : (
								"Create User"
							)}
						</Button>
					</div>

					{/* Error Messages */}
					{createMutation.error && (
						<div className="bg-red-50 border border-red-200 rounded-md p-4">
							<p className="text-red-600 text-sm">
								{createMutation.error.message}
							</p>
						</div>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
