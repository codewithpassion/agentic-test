import { AdminDashboard } from "~/components/admin/admin-dashboard";

export default function AdminIndexPage() {
	return <AdminDashboard />;
}

export function meta() {
	return [
		{ title: "Admin Dashboard - WDA Photo Competition" },
		{
			name: "description",
			content: "Administrative dashboard for managing photo competitions",
		},
	];
}
