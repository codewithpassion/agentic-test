import { Bell, Home, LogOut, Menu, Settings, User } from "lucide-react";
import { Link } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useAuth } from "~/hooks/use-auth";
import { cn } from "~/lib/utils";

interface AdminHeaderProps {
	onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
	const { user } = useAuth();

	const getInitials = (name?: string) => {
		if (!name) return "A";
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase();
	};

	const getRoleBadgeColor = (role: string) => {
		switch (role) {
			case "superadmin":
				return "bg-red-100 text-red-800";
			case "admin":
				return "bg-blue-100 text-blue-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<header className="bg-white border-b border-gray-200 px-4 py-3">
			<div className="flex items-center justify-between">
				{/* Left side - Menu button and title */}
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={onMenuClick}
						className="lg:hidden"
					>
						<Menu className="h-5 w-5" />
					</Button>

					<div>
						<h1 className="text-xl font-semibold text-gray-900">
							Admin Dashboard
						</h1>
						<p className="text-sm text-gray-500">
							Wildlife Disease Association Photo Competition
						</p>
					</div>
				</div>

				{/* Right side - Actions and user menu */}
				<div className="flex items-center gap-4">
					{/* View site link */}
					<Button
						variant="outline"
						size="sm"
						asChild
						className="border-gray-300 text-gray-700 hover:bg-gray-50"
					>
						<Link to="/">
							<Home className="h-4 w-4 mr-2" />
							View Site
						</Link>
					</Button>

					{/* Notifications */}
					{/* <Button
						variant="ghost"
						size="sm"
						className="relative text-gray-600 hover:text-gray-900"
					>
						<Bell className="h-5 w-5" />
						<Badge
							variant="destructive"
							className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
						>
							3
						</Badge>
					</Button> */}

					{/* User menu */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="flex items-center gap-4 px-4 py-5 hover:bg-gray-100 border border-gray-300 rounded-md"
							>
								<Avatar className="h-8 w-8">
									<AvatarImage src={user?.image || undefined} />
									<AvatarFallback className="text-sm">
										{getInitials(user?.name)}
									</AvatarFallback>
								</Avatar>
								<div className="text-left hidden md:block">
									<div className="text-sm font-medium text-gray-900">
										{user?.name || "Admin"}
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs text-gray-500">{user?.email}</span>
										{/* <Badge
											variant="secondary"
											className={cn(
												"text-xs",
												getRoleBadgeColor(
													Array.isArray(user?.roles) && user?.roles.length > 0
														? user.roles[0]
														: "user",
												),
											)}
										>
											{Array.isArray(user?.roles) && user?.roles.length > 0
												? user.roles[0]
												: "user"}
										</Badge> */}
									</div>
								</div>
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent align="end" className="w-56">
							{/* <DropdownMenuLabel>My Account</DropdownMenuLabel>
							<DropdownMenuSeparator /> */}

							{/* Disabled for now
							<DropdownMenuItem asChild>
								<Link to="/admin/profile">
									<User className="h-4 w-4 mr-2" />
									Profile Settings
								</Link>
							</DropdownMenuItem> */}

							{/* Disabled for now
							<DropdownMenuItem asChild>
								<Link to="/admin/preferences">
									<Settings className="h-4 w-4 mr-2" />
									Preferences
								</Link>
							</DropdownMenuItem> */}

							{/* <DropdownMenuSeparator /> */}

							<DropdownMenuItem asChild>
								<Link to="/logout">
									<LogOut className="h-4 w-4 mr-2" />
									Sign Out
								</Link>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
