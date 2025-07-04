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

	if (error || !user) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<p className="text-red-600">User not found</p>
					<p className="text-sm text-gray-500 mt-1">
						{error?.message || "The user you're looking for doesn't exist."}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Edit User</h1>
				<p className="text-gray-600">Modify user details and permissions</p>
			</div>

			<UserForm mode="edit" user={user} />
		</div>
	);
}

export function meta() {
	return [
		{ title: "Edit User - Admin Dashboard" },
		{ name: "description", content: "Edit user details and permissions" },
	];
}
