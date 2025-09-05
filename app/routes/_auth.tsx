import { getAuth } from "@clerk/react-router/ssr.server";
import { type LoaderFunctionArgs, Outlet, redirect } from "react-router";

export async function loader(args: LoaderFunctionArgs) {
	const { userId } = await getAuth(args);

	if (!userId) {
		return redirect("/login");
	}

	return null;
}

export default function Protected() {
	return <Outlet />;
}
