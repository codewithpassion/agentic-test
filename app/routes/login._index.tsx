import { SignIn } from "@clerk/react-router";
import { useLoaderData, useSearchParams } from "react-router";
import type { Route } from "./+types/login";

import { DevClerkLoginButton } from "~/components/features/login/dev-clerk-login-button";

export async function loader({ context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;

	return {
		environment: env.ENVIRONMENT,
		testEmail: env.VITE_CLERK_TEST_EMAIL,
		testPassword: env.VITE_CLERK_TEST_PASSWORD,
	};
}
export default function LoginPage() {
	const { environment, testEmail, testPassword } =
		useLoaderData<typeof loader>();
	const [searchParams] = useSearchParams();
	const redirectUrl = searchParams.get("redirect_url") || "/";
	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="flex flex-col items-center gap-4">
				<SignIn
					routing="virtual"
					signUpUrl="/sign-up"
					afterSignInUrl="/dashboard"
					appearance={{
						elements: {
							card: "shadow-none",
							rootBox: "w-full max-w-md",
						},
					}}
				/>
				<DevClerkLoginButton
					environment={environment}
					testEmail={testEmail}
					testPassword={testPassword}
					redirectUrl={redirectUrl}
				/>
			</div>
		</div>
	);
}
