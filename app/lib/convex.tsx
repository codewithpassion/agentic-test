import { useAuth } from "@clerk/react-router";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";

export function ConvexClientProvider({
	children,
	convexUrl,
}: { convexUrl: string; children: ReactNode }) {
	const convex = new ConvexReactClient(convexUrl);
	return (
		<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
			{children}
		</ConvexProviderWithClerk>
	);
}
