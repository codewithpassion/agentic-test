import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { useAuth } from "~/hooks/use-auth";

export function UserCreateForm() {
	const navigate = useNavigate();
	const { hasRole } = useAuth();

	if (!hasRole("superadmin")) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="text-center text-red-600">
						<p>SuperAdmin role required to manage users</p>
						<Button
							variant="outline"
							onClick={() => navigate("/admin/users")}
							className="mt-4"
						>
							Back to Users
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Create New Users</CardTitle>
					<CardDescription>
						User accounts are created through Clerk's authentication system
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div>
							<h4 className="font-medium mb-2">
								Option 1: User Self-Registration
							</h4>
							<p className="text-sm text-gray-600 mb-3">
								Users can create their own accounts through the application's
								sign-up page. They will receive the default "user" role upon
								registration.
							</p>
							<Button variant="outline" asChild>
								<a href="/sign-up" target="_blank" rel="noopener noreferrer">
									<ExternalLink className="h-4 w-4 mr-2" />
									View Sign-Up Page
								</a>
							</Button>
						</div>

						<div className="border-t pt-4">
							<h4 className="font-medium mb-2">Option 2: Clerk Dashboard</h4>
							<p className="text-sm text-gray-600 mb-3">
								As an administrator, you can create users directly in the Clerk
								dashboard. This allows you to set custom metadata and manage
								authentication settings.
							</p>
							<Button variant="outline" asChild>
								<a
									href="https://dashboard.clerk.com"
									target="_blank"
									rel="noopener noreferrer"
								>
									<ExternalLink className="h-4 w-4 mr-2" />
									Open Clerk Dashboard
								</a>
							</Button>
						</div>

						<div className="border-t pt-4">
							<h4 className="font-medium mb-2">Option 3: Invite Users</h4>
							<p className="text-sm text-gray-600">
								You can implement an invitation system where administrators can
								send email invites to new users. This requires additional
								configuration in your Clerk dashboard and custom invitation flow
								implementation.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>After User Creation</CardTitle>
					<CardDescription>
						What happens when a new user is created
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
						<li>User signs up or is created in Clerk</li>
						<li>
							Clerk triggers webhook or user signs in, syncing data to Convex
							database
						</li>
						<li>Default role "user" is assigned automatically</li>
						<li>
							You can edit the user from the{" "}
							<Button
								variant="link"
								className="p-0 h-auto text-blue-600"
								onClick={() => navigate("/admin/users")}
							>
								User Management
							</Button>{" "}
							page to assign additional roles
						</li>
						<li>Email verification is handled by Clerk if configured</li>
					</ol>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Why Use Clerk for User Creation?</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="space-y-2 text-sm text-gray-600">
						<li className="flex items-start gap-2">
							<span className="text-green-600 mt-0.5">✓</span>
							<span>
								Secure authentication with built-in password policies and MFA
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-green-600 mt-0.5">✓</span>
							<span>Automatic email verification and password reset flows</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-green-600 mt-0.5">✓</span>
							<span>Social login providers (Google, GitHub, etc.)</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-green-600 mt-0.5">✓</span>
							<span>
								Session management and JWT tokens handled automatically
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-green-600 mt-0.5">✓</span>
							<span>GDPR compliant with user data management</span>
						</li>
					</ul>
				</CardContent>
			</Card>

			<div className="flex justify-center">
				<Button onClick={() => navigate("/admin/users")}>
					Back to User Management
				</Button>
			</div>
		</div>
	);
}
