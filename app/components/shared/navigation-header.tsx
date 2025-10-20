import { SignedIn, SignedOut, UserButton } from "@clerk/react-router";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/hooks/use-auth";

export function NavigationHeader() {
	const { user, isAdmin } = useAuth();

	return (
		<nav className="bg-white border-b border-gray-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<div className="flex items-center space-x-8">
						<div className="text-xl font-bold text-gray-900">
							Worktime Tracker
						</div>
						<div className="hidden md:flex space-x-6 text-sm">
							<Link to="/" className="text-gray-900 hover:text-gray-600">
								Home
							</Link>
						</div>
					</div>
					<div className="flex items-center space-x-4">
						<SignedIn>
							<div className="flex items-center gap-2">
								{isAdmin() && (
									<Button asChild variant="ghost" size="sm">
										<Link to="/admin">Admin Panel</Link>
									</Button>
								)}
								<UserButton
									afterSignOutUrl="/"
									appearance={{
										elements: {
											avatarBox: "h-8 w-8",
										},
									}}
								/>
							</div>
						</SignedIn>
						<SignedOut>
							<Button asChild size="sm">
								<Link to="/login">Sign In</Link>
							</Button>
						</SignedOut>
					</div>
				</div>
			</div>
		</nav>
	);
}
