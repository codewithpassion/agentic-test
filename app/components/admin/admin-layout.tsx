import { useState } from "react";
import { Outlet } from "react-router";
import { Navigate } from "react-router";
import { useAuth } from "~/contexts/auth-context";
import { AdminBreadcrumbs } from "./admin-breadcrumbs";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";

export function AdminLayout() {
	const { isAdmin } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	// Redirect non-admin users
	if (!isAdmin()) {
		return <Navigate to="/unauthorized" replace />;
	}

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Sidebar */}
			<AdminSidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
			/>

			{/* Main content area */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Header */}
				<AdminHeader onMenuClick={() => setSidebarOpen(true)} />

				{/* Breadcrumbs */}
				<AdminBreadcrumbs />

				{/* Main content */}
				<main className="flex-1 overflow-y-auto bg-white">
					<div className="container mx-auto px-4 py-6">
						<Outlet />
					</div>
				</main>
			</div>

			{/* Mobile sidebar overlay */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
					onClick={() => setSidebarOpen(false)}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							setSidebarOpen(false);
						}
					}}
					role="button"
					tabIndex={0}
				/>
			)}
		</div>
	);
}
