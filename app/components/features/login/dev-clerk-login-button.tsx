import { useSignIn } from "@clerk/react-router";
import { useNavigate } from "react-router";

interface DevClerkLoginButtonProps {
	testEmail?: string;
	testPassword?: string;
	environment?: string;
	redirectUrl?: string;
}

export function DevClerkLoginButton({
	testEmail,
	testPassword,
	environment,
	redirectUrl,
}: DevClerkLoginButtonProps) {
	const { isLoaded, signIn, setActive } = useSignIn();
	const navigate = useNavigate();

	console.log("DevClerkLoginButton environment:", environment);

	// Only show in development environment
	if (environment !== "development") return null;
	if (!isLoaded) return null;
	if (!testEmail || !testPassword) {
		return null;
	}

	const handleDevLogin = async () => {
		try {
			const res = await signIn.create({
				identifier: testEmail,
				password: testPassword,
			});

			if (res.createdSessionId) {
				await setActive({ session: res.createdSessionId });
				// Navigate after setting active session
				navigate(redirectUrl || "/");
			}
		} catch (error) {
			console.error("Dev login failed:", error);
		}
	};

	return (
		<button
			type="button"
			onClick={handleDevLogin}
			className="mt-4 w-full rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 transition-colors"
		>
			🔧 Dev: Quick Login
		</button>
	);
}
