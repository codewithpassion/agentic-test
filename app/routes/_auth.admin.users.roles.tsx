import { RoleManager } from "~/components/features/admin/role-manager";

export default function AdminUserRolesPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Roles & Permissions</h1>
				<p className="text-gray-600">
					Understand the role hierarchy and permission system
				</p>
			</div>

			<RoleManager />
		</div>
	);
}

export function meta() {
	return [
		{ title: "Roles & Permissions - Admin Dashboard" },
		{ name: "description", content: "Manage user roles and permissions" },
	];
}
