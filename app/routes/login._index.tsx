import { Mail } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useSearchParams } from "react-router";
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
	const [searchParams] = useSearchParams();
	const [result, setResult] = useState<
		{ error: string; status: number } | undefined
	>(undefined);

	useEffect(() => {
		const error = searchParams.get("error");
		if (error === "verification_failed") {
			setResult({
				error: "The magic link is invalid or has expired. Please try again.",
				status: 401,
			});
		} else if (error) {
			setResult({ error: error, status: 401 });
		}
	}, [searchParams]);

	const submit = async ({ email }: { email: string }) => {
		signIn.magicLink(
			{
				email,
				callbackURL: "/todos",
			},
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
						Enter your email to receive a login link
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
							{submitting ? "Sending..." : "Send Login Link"}
						</Button>
					</form>

					<Outlet />
				</CardContent>
			</Card>
		</div>
	);
}
