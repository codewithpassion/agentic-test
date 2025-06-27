import { LogOut, User } from "lucide-react";
import { Link } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useAuth } from "~/hooks/use-auth";

export function NavigationHeader() {
	const { user } = useAuth();

	const getInitials = (name?: string) => {
		if (!name) return "U";
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase();
	};

	return (
		<nav className="bg-white border-b border-gray-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<div className="flex items-center space-x-8">
						<div className="text-xl font-bold text-gray-900">Todo App</div>
						<div className="hidden md:flex space-x-6 text-sm">
							<Link to="/" className="text-gray-900 hover:text-gray-600">
								Home
							</Link>
							<Link to="/todos" className="text-gray-900 hover:text-gray-600">
								Todos
							</Link>
						</div>
					</div>
					<div className="flex items-center space-x-4">
						{user ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-full"
									>
										<Avatar className="h-8 w-8">
											<AvatarImage src={user.image || undefined} />
											<AvatarFallback className="text-sm bg-gray-200">
												{getInitials(user.name)}
											</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>

								<DropdownMenuContent align="end" className="w-56">
									<div className="px-2 py-1.5">
										<p className="text-sm font-medium">{user.name || "User"}</p>
										<p className="text-xs text-gray-500">{user.email}</p>
									</div>
									<DropdownMenuSeparator />

									{user.roles &&
										(user.roles.includes("admin") ||
											user.roles.includes("superadmin")) && (
											<DropdownMenuItem asChild>
												<Link to="/admin">
													<User className="h-4 w-4 mr-2" />
													Admin Panel
												</Link>
											</DropdownMenuItem>
										)}

									<DropdownMenuSeparator />

									<DropdownMenuItem asChild>
										<Link to="/logout">
											<LogOut className="h-4 w-4 mr-2" />
											Sign Out
										</Link>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							<Button asChild size="sm">
								<Link to="/login">Sign In</Link>
							</Button>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
}
