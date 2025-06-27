import { AlertCircle, CheckCircle, Shield } from "lucide-react";
import { useState } from "react";
import {
	type LoaderFunctionArgs,
	type MetaFunction,
	data,
	redirect,
	useLoaderData,
	useNavigate,
} from "react-router";
import { PublicLayout } from "~/components/public-layout";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { LoadingSpinner } from "~/components/ui/loading-spinner";

export const meta: MetaFunction = () => {
	return [
		{ title: "Confirm Sign In - Todo App" },
		{ name: "description", content: "Confirm your sign in to Todo App" },
	];
};

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const token = url.searchParams.get("token");

	if (!token) {
		return redirect("/login");
	}

	return data({
		token,
	});
}

export default function MagicLinkConfirm() {
	const { token } = useLoaderData<typeof loader>();
	const navigate = useNavigate();
	const [isVerifying, setIsVerifying] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleConfirm = async () => {
		setIsVerifying(true);
		setError(null);

		try {
			// Navigate to the verification route with the token
			navigate(`/auth/magic-link/verify?token=${encodeURIComponent(token)}`);
		} catch (err) {
			setError("An error occurred. Please try again.");
			setIsVerifying(false);
		}
	};

	const handleCancel = () => {
		navigate("/login");
	};

	if (error) {
		return (
			<PublicLayout>
				<div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
					<Card className="w-full max-w-md">
						<CardHeader className="space-y-1">
							<div className="flex justify-center mb-4">
								<AlertCircle className="h-12 w-12 text-red-500" />
							</div>
							<CardTitle className="text-2xl font-bold text-center">
								Sign In Failed
							</CardTitle>
							<CardDescription className="text-center">{error}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Button onClick={() => navigate("/login")} className="w-full">
								Back to Login
							</Button>
						</CardContent>
					</Card>
				</div>
			</PublicLayout>
		);
	}

	return (
		<PublicLayout>
			<div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
				<Card className="w-full max-w-md">
					<CardHeader className="space-y-1">
						<div className="flex justify-center mb-4">
							<Shield className="h-12 w-12 text-blue-500" />
						</div>
						<CardTitle className="text-2xl font-bold text-center">
							Confirm Your Sign In
						</CardTitle>
						<CardDescription className="text-center">
							For your security, please confirm that you want to sign in to your
							account.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Action Buttons */}
						<div className="space-y-3">
							<Button
								onClick={handleConfirm}
								disabled={isVerifying}
								className="w-full"
								size="lg"
							>
								{isVerifying ? (
									<>
										<LoadingSpinner size="sm" className="mr-2" />
										Signing you in...
									</>
								) : (
									<>
										<CheckCircle className="h-4 w-4 mr-2" />
										Yes, Sign Me In
									</>
								)}
							</Button>
							<Button
								onClick={handleCancel}
								variant="outline"
								disabled={isVerifying}
								className="w-full"
							>
								Cancel
							</Button>
						</div>

						<div className="text-xs text-gray-500 text-center">
							This link will expire in 15 minutes and can only be used once.
						</div>
					</CardContent>
				</Card>
			</div>
		</PublicLayout>
	);
}
