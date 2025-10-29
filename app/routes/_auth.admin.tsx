import { Outlet } from "react-router";
import { AdminLayout } from "~/components/features/admin/admin-layout";

export function meta() {
	return [
		{ title: "Admin Dashboard - Todo App" },
		{
			name: "description",
			content: "Administrative dashboard for managing the todo application",
		},
	];
}

export default function AdminRoutes() {
	return <AdminLayout />;
}
