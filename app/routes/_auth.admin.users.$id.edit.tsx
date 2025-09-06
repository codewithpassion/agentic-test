import { useParams } from "react-router";
import { UserForm } from "~/components/features/admin/user-form";
import { useAuth } from "~/hooks/use-auth";

export default function EditUserPage() {
	const { id } = useParams();
	const { hasRole } = useAuth();

	// Only superadmins can edit users
	if (!hasRole("superadmin")) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold">Access Denied</h1>
					<p className="text-red-600">
						Only Super Administrators can edit user roles and permissions.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Edit User</h1>
				<p className="text-gray-600">Modify user roles and permissions</p>
			</div>

			<UserForm mode="edit" userId={id} />
		</div>
	);
}

export function meta() {
	return [
		{ title: "Edit User - Admin Dashboard" },
		{ name: "description", content: "Edit user details and permissions" },
	];
}
