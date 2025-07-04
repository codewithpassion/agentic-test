import { AdminDashboard } from "~/components/features/admin/admin-dashboard";

export default function AdminIndexPage() {
	return <AdminDashboard />;
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
