import {
	type ActionFunctionArgs,
	type AppLoadContext,
	type LoaderFunctionArgs,
	data,
	redirect,
} from "react-router";
import { authFactory } from "~~/auth";

export async function loader({ request, context }: LoaderFunctionArgs) {
	const c: AppLoadContext = context;
	const url = new URL(request.url);
	const token = url.searchParams.get("token");
	const error = url.searchParams.get("error");

	if (error) {
		// Handle error from better-auth
		console.error("Magic link error:", error);
		return redirect(`/login?error=${encodeURIComponent(error)}`);
	}

	if (!token) {
		return redirect("/login");
	}

	try {
		// Create auth instance
		const auth = await authFactory(c.cloudflare.env, request);

		// The actual magic link verification happens through better-auth's API
		// We need to make a request to the auth endpoint with the token
		const verifyUrl = new URL("/api/auth/magic-link/verify", url.origin);
		verifyUrl.searchParams.set("token", token);
		verifyUrl.searchParams.set("callbackURL", "/todos");

		// Create a new request to the verification endpoint
		const verifyRequest = new Request(verifyUrl.toString(), {
			method: "GET",
			headers: request.headers,
		});

		// Let better-auth handle the verification
		const response = await auth.handler(verifyRequest);

		// Check if verification was successful
		if (response.status === 302 || response.status === 200) {
			// Get the redirect location from the response
			const redirectTo = response.headers.get("Location") || "/todos";

			// Extract any set-cookie headers to forward them
			const setCookieHeaders = response.headers.get("Set-Cookie");

			if (setCookieHeaders) {
				// Return a response that sets the cookies and redirects
				return new Response(null, {
					status: 302,
					headers: {
						Location: redirectTo,
						"Set-Cookie": setCookieHeaders,
					},
				});
			}

			return redirect(redirectTo);
		}

		// If verification failed, redirect to login with error
		const errorMessage = await response.text();
		console.error("Verification failed:", errorMessage);
		return redirect("/login?error=verification_failed");
	} catch (error) {
		console.error("Magic link verification error:", error);
		return redirect("/login?error=verification_failed");
	}
}

// This route only handles GET requests for verification
export default function MagicLinkVerify() {
	// This component should never render as we always redirect
	return null;
}
