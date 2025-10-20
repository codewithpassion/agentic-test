import { Home, Shield } from "lucide-react";
import { Link } from "react-router";
import { PublicLayout } from "~/components/layouts/public-layout";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

export default function UnauthorizedPage() {
	return (
		<PublicLayout>
			<div className="flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
				<Card className="max-w-md w-full">
					<CardContent className="p-8 text-center">
						<Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							Access Denied
						</h1>
						<p className="text-gray-600 mb-6">
							You don't have permission to access this page. Please contact an
							administrator if you believe this is an error.
						</p>
						<div className="space-y-3">
							<Button asChild className="w-full">
								<Link to="/">
									<Home className="h-4 w-4 mr-2" />
									Return Home
								</Link>
							</Button>
							<Button variant="outline" asChild className="w-full">
								<Link to="/logout">Sign Out</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</PublicLayout>
	);
}

export function meta() {
	return [
		{ title: "Access Denied - Worktime Tracker" },
		{
			name: "description",
			content: "You don't have permission to access this page",
		},
	];
}
