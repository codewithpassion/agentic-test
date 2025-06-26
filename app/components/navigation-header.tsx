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
import { trpc } from "~/lib/trpc";

export function NavigationHeader() {
	const { user } = useAuth();

	// Fetch active competitions
	const { data: competitions = [] } = trpc.competitions.list.useQuery({
		status: "active",
		limit: 1,
	});

	// Get the first active competition
	const activeCompetition = competitions[0];

	// Get categories for the active competition
	const { data: categories = [] } = trpc.categories.listByCompetition.useQuery(
		{ competitionId: activeCompetition?.id || "" },
		{ enabled: !!activeCompetition?.id },
	);

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
						<div className="text-xl font-bold text-gray-900">
							2025 Wildlife Photo Contest
						</div>
						<div className="hidden md:flex space-x-6 text-sm">
							<Link to="/" className="text-gray-900 hover:text-gray-600">
								Home
							</Link>
							<Link to="/about" className="text-gray-900 hover:text-gray-600">
								About
							</Link>
							{categories.map((category) => (
								<Link
									key={category.id}
									to={
										activeCompetition
											? `/competitions/${activeCompetition.id}/gallery/${category.id}`
											: "#"
									}
									className="text-gray-900 hover:text-gray-600"
								>
									{category.name}
								</Link>
							))}
							<Link to="/contact" className="text-gray-900 hover:text-gray-600">
								Contact
							</Link>
						</div>
					</div>
					<div className="flex items-center space-x-4">
						{/* Social icons */}
						{/* <div className="hidden sm:flex items-center space-x-2 text-gray-600">
							<span>📧</span>
							<span>🐦</span>
							<span>📷</span>
						</div> */}

						{/* User menu or Sign in button */}
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

									<DropdownMenuItem asChild>
										<Link to="/my-submissions">
											<User className="h-4 w-4 mr-2" />
											My Submissions
										</Link>
									</DropdownMenuItem>

									{/* Show admin link if user is admin or superadmin */}
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
