import { UserList } from "~/components/features/admin/user-list";

export default function AdminUsersPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">User Management</h1>
				<p className="text-gray-600">
					Manage user accounts, roles, and permissions
				</p>
			</div>

			<UserList />
		</div>
	);
}

export function meta() {
	return [
		{ title: "User Management - Admin Dashboard" },
		{ name: "description", content: "Manage user accounts and roles" },
	];
}
