import { useMemo } from "react";
import { useRouteLoaderData } from "react-router";

export function useAuth() {
	const { user, session } = useRouteLoaderData("root");
	return useMemo(() => {
		return {
			user,
			session,
			isAuthenticated: !!user && !!session,
			isAdmin: user?.role === "admin",
			isSuperAdmin: user?.role === "superadmin",
		};
	}, [user, session]);
}
