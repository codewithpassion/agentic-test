import { Mail } from "lucide-react";
import { useContext, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { LoginContext, LoginProvider } from "~/data/login.context";
import { signIn } from "~~/auth-client";

export default function Login() {
	const navigate = useNavigate();
	const [result, setResult] = useState<
		{ error: string; status: number } | undefined
	>(undefined);

	const submit = async ({ email }: { email: string }) => {
		signIn.magicLink(
			{ email, callbackURL: `${window.location.origin}/` },
			{
				onSuccess: () => {
					console.log("Success");
					navigate("/verify");
				},
				onError: (error) => {
					console.error("Error signing in:", error);
					setResult({ error: "Unauthorized", status: 401 });
				},
			},
		);
	};

	return (
		<LoginProvider
			onSubmit={async (email) => {
				await submit({ email });
			}}
			error={result}
		>
			<LoginPage />
		</LoginProvider>
	);
}

export function LoginPage() {
	const { email, setEmail, submit, submitting, error } =
		useContext(LoginContext);

	return (
		<div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold text-center">
						Sign in to your account
					</CardTitle>
					<CardDescription className="text-center">
						Enter your email to receive a magic link
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							submit();
						}}
						className="space-y-4"
					>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="name@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={submitting}
							/>
						</div>

						{error && (
							<div className="text-red-500 text-sm text-center">
								{error || "An error occurred. Please try again."}
							</div>
						)}

						<Button type="submit" className="w-full" disabled={submitting}>
							<Mail className="w-4 h-4 mr-2" />
							{submitting ? "Sending..." : "Send Magic Link"}
						</Button>
					</form>

					<div className="relative my-6">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-gray-300" />
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="bg-white px-2 text-gray-500">Or</span>
						</div>
					</div>

					<div className="text-center">
						<p className="text-sm text-gray-600">
							Don't have an account?{" "}
							<Link
								to="/signup"
								className="font-medium text-gray-900 hover:underline"
							>
								Sign up
							</Link>
						</p>
					</div>

					<Outlet />
				</CardContent>
			</Card>
		</div>
	);
}
