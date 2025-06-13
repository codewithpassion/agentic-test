import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router";

interface BreadcrumbItem {
	label: string;
	href?: string;
}

const routeMap: Record<string, string> = {
	admin: "Dashboard",
	competitions: "Competitions",
	moderation: "Photo Moderation",
	pending: "Pending Photos",
	photos: "All Photos",
	reports: "Reports",
	users: "User Management",
	roles: "Roles & Permissions",
	settings: "Settings",
	categories: "Categories",
	winners: "Winners",
};

export function AdminBreadcrumbs() {
	const location = useLocation();

	const generateBreadcrumbs = (): BreadcrumbItem[] => {
		const pathSegments = location.pathname.split("/").filter(Boolean);
		const breadcrumbs: BreadcrumbItem[] = [];

		// Always start with home
		breadcrumbs.push({ label: "Home", href: "/" });

		// Build breadcrumbs from path segments
		let currentPath = "";
		pathSegments.forEach((segment, index) => {
			currentPath += `/${segment}`;
			const label =
				routeMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

			// Don't add href to the last item (current page)
			const href = index === pathSegments.length - 1 ? undefined : currentPath;

			breadcrumbs.push({ label, href });
		});

		return breadcrumbs;
	};

	const breadcrumbs = generateBreadcrumbs();

	// Don't show breadcrumbs if only home/admin
	if (breadcrumbs.length <= 2) return null;

	return (
		<nav className="bg-gray-50 border-b border-gray-200 px-4 py-2">
			<ol className="flex items-center space-x-2 text-sm">
				{breadcrumbs.map((breadcrumb, index) => (
					<li
						key={`${breadcrumb.label}-${index}`}
						className="flex items-center"
					>
						{index > 0 && (
							<ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
						)}

						{index === 0 && <Home className="h-4 w-4 mr-2 text-gray-500" />}

						{breadcrumb.href ? (
							<Link
								to={breadcrumb.href}
								className="text-gray-600 hover:text-gray-900 transition-colors"
							>
								{breadcrumb.label}
							</Link>
						) : (
							<span className="text-gray-900 font-medium">
								{breadcrumb.label}
							</span>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}
