import { UserCreateForm } from "~/components/admin/user-create-form";

export default function NewUserPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Create New User</h1>
				<p className="text-gray-600">Add a new user account to the system</p>
			</div>

			<UserCreateForm />
		</div>
	);
}

export function meta() {
	return [
		{ title: "Create User - Admin Dashboard" },
		{ name: "description", content: "Create a new user account" },
	];
}
