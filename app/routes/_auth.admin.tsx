import { AdminLayout } from "~/components/admin/admin-layout";

export default function AdminLayoutRoute() {
	return <AdminLayout />;
}

export function meta() {
	return [
		{ title: "Admin Dashboard - Todo App" },
		{
			name: "description",
			content: "Administrative dashboard for managing the todo application",
		},
	];
}
