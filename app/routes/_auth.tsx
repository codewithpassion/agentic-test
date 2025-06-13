import {
	type AppLoadContext,
	type LoaderFunctionArgs,
	Outlet,
	redirect,
	useLoaderData,
} from "react-router";
import { AuthProvider } from "~/contexts/auth-context";
import { authFactory } from "~~/auth";
import type { AuthUser } from "~~/types";

export async function loader(args: LoaderFunctionArgs) {
	const c: AppLoadContext = args.context;

	const session = await (
		await authFactory(c.cloudflare.env, args.request)
	).api.getSession({
		headers: args.request.headers,
	});

	if (!session || !session.user) {
		return redirect("/login");
	}
	return {
		session,
	};
}

export default function Protected() {
	const { session } = useLoaderData<typeof loader>();

	// @ts-ignore
	const user: AuthUser | undefined = session?.user || undefined;

	return (
		<>
			<AuthProvider user={user}>
				<Outlet />
			</AuthProvider>
		</>
	);
}
