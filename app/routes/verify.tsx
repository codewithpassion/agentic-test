import { CheckCircle } from "lucide-react";
import { Link } from "react-router";
import { PublicLayout } from "~/components/public-layout";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

export default function VerifyPage() {
	return (
		<PublicLayout>
			<div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
				<Card className="w-full max-w-md">
					<CardHeader className="space-y-1">
						<div className="flex justify-center mb-4">
							<CheckCircle className="h-12 w-12 text-green-500" />
						</div>
						<CardTitle className="text-2xl font-bold text-center">
							Check your email
						</CardTitle>
						<CardDescription className="text-center">
							We have sent you an email with a magic link to sign in to your
							account.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-center text-gray-600">
							Click the link in the email to complete your sign in. The link
							will expire in 15 minutes.
						</p>

						<div className="text-center">
							<p className="text-sm text-gray-600 mb-4">
								Didn't receive the email? Check your spam folder or
							</p>
							<Button variant="outline" asChild>
								<Link to="/login">Try again</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</PublicLayout>
	);
}
