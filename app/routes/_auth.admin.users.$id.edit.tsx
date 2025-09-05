import { useParams } from "react-router";
import { UserForm } from "~/components/features/admin/user-form";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { useUser } from "~/hooks/use-user-management";

export default function EditUserPage() {
	const { id } = useParams();

	const { data: user, isLoading, error } = useUser(id || "", !!id);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<LoadingSpinner />
			</div>
		);
	}

	// Since user management is handled in Clerk dashboard, redirect or show message
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Edit User</h1>
				<p className="text-gray-600">Modify user details and permissions</p>
			</div>

			<UserForm mode="edit" />
		</div>
	);
}

export function meta() {
	return [
		{ title: "Edit User - Admin Dashboard" },
		{ name: "description", content: "Edit user details and permissions" },
	];
}
