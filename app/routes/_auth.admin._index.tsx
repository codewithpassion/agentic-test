import { AdminDashboard } from "~/components/admin/admin-dashboard";

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
