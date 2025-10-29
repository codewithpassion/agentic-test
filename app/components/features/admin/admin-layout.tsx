import { useState } from "react";
import { Outlet, replace } from "react-router";
import { useAuth } from "~/hooks/use-auth";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";

export async function loader() {
	// Note: This is a layout component. Real auth checks should happen in route loaders.
	// This is a client-side fallback for protected content.
	return null;
}

export function AdminLayout() {
	const { isAdmin, isPending } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	// Wait for auth to load before checking permissions
	if (isPending) {
		return (
			<div className="flex h-screen items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
					<p className="mt-4 text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	// Redirect non-admin users
	if (!isAdmin()) {
		throw replace("/unauthorized");
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
