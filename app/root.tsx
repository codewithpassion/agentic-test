import { ClerkProvider } from "@clerk/react-router";
import { rootAuthLoader } from "@clerk/react-router/ssr.server";
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	isRouteErrorResponse,
} from "react-router";

import type { Route } from "./+types/root";
import "./tailwind.css";
import { Toaster } from "~/components/ui/sonner";
import { AuthProvider } from "~/contexts/auth-context";
import { TRPCProvider } from "~/providers/trpc-provider";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

export async function loader(args: Route.LoaderArgs) {
	console.log("CLerk Key", args.context.cloudflare.env.CLERK_SECRET_KEY);
	return rootAuthLoader(
		args,
		({ request, context, params }) => {
			const { sessionId, userId, getToken } = request.auth;
			// Add logic to fetch data
			return { yourData: "here" };
		},
		{
			secretKey: args.context.cloudflare.env.CLERK_SECRET_KEY,
			publishableKey: args.context.cloudflare.env.VITE_CLERK_PUBLISHABLE_KEY,
		}, // Options
	);
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App({ loaderData }: Route.ComponentProps) {
	return (
		<ClerkProvider loaderData={loaderData}>
			<TRPCProvider>
				<AuthProvider>
					<Outlet />
					<Toaster />
				</AuthProvider>
			</TRPCProvider>
		</ClerkProvider>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="bg-white pt-16 p-4 container mx-auto color-black">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto color-black">
					<code className="color-black">{stack}</code>
				</pre>
			)}
		</main>
	);
}
