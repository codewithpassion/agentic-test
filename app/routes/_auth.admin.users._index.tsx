import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function AdminUsersPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">User Management</h1>
				<p className="text-gray-600">Manage users, roles, and permissions</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Users</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-12 text-gray-500">
						<p>
							User management interface will be implemented in a future phase
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export function meta() {
	return [
		{ title: "User Management - Admin Dashboard" },
		{ name: "description", content: "Manage users and permissions" },
	];
}
