import {
	ChevronRight,
	LayoutDashboard,
	ListTodo,
	Users,
	X,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/hooks/use-auth";
import { cn } from "~/lib/utils";
import type { Permission, UserRole } from "~/types/auth";

interface AdminSidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

interface NavItem {
	icon: React.ElementType;
	label: string;
	href: string;
	permission?: string;
	role?: string;
	children?: NavItem[];
}

const navigationItems: NavItem[] = [
	{
		icon: LayoutDashboard,
		label: "Dashboard",
		href: "/admin",
	},
	{
		icon: ListTodo,
		label: "Todos",
		href: "/todos",
	},
	{
		icon: Users,
		label: "User Management",
		href: "/admin/users",
		role: "superadmin",
		children: [
			{
				icon: ChevronRight,
				label: "All Users",
				href: "/admin/users",
			},
			{
				icon: ChevronRight,
				label: "Roles & Permissions",
				href: "/admin/users/roles",
			},
		],
	},
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
	const location = useLocation();
	const { hasPermission, hasRole } = useAuth();

	const isItemVisible = (item: NavItem) => {
		if (item.permission && !hasPermission(item.permission as Permission))
			return false;
		if (item.role && !hasRole(item.role as UserRole)) return false;
		return true;
	};

	const isItemActive = (href: string) => {
		if (href === "/admin") {
			return location.pathname === "/admin";
		}
		return location.pathname.startsWith(href);
	};

	return (
		<aside
			className={cn(
				"fixed left-0 top-0 z-50 h-screen w-64 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
				isOpen ? "translate-x-0" : "-translate-x-full",
			)}
		>
			{/* Sidebar header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-200">
				<h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
					className="lg:hidden"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto p-4">
				<ul className="space-y-2">
					{navigationItems.map((item) => {
						if (!isItemVisible(item)) return null;

						const Icon = item.icon;
						const isActive = isItemActive(item.href);

						return (
							<li key={item.href}>
								<Link
									to={item.href}
									onClick={onClose}
									className={cn(
										"flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
										isActive
											? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
											: "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
									)}
								>
									<Icon className="h-5 w-5" />
									{item.label}
								</Link>

								{/* Sub-navigation */}
								{item.children && isActive && (
									<ul className="mt-2 ml-8 space-y-1">
										{item.children.map((child) => (
											<li key={child.href}>
												<Link
													to={child.href}
													onClick={onClose}
													className={cn(
														"flex items-center gap-2 px-3 py-1 text-xs rounded-md transition-colors",
														location.pathname === child.href
															? "bg-blue-50 text-blue-700"
															: "text-gray-600 hover:bg-gray-50 hover:text-gray-800",
													)}
												>
													<ChevronRight className="h-3 w-3" />
													{child.label}
												</Link>
											</li>
										))}
									</ul>
								)}
							</li>
						);
					})}
				</ul>
			</nav>

			{/* Sidebar footer */}
			<div className="p-4 border-t border-gray-200">
				<div className="text-xs text-gray-500 text-center">
					Todo App
					<br />
					Admin Panel
				</div>
			</div>
		</aside>
	);
}
