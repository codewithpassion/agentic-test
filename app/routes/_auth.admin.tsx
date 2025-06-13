import { AdminLayout } from "~/components/admin/admin-layout";

export default function AdminLayoutRoute() {
	return <AdminLayout />;
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
