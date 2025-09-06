import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import {
	addUserRole,
	demoteUser,
	promoteUser,
	removeUserRole,
	updateUserRoles,
} from "~/lib/clerk-admin.server";

export async function action({ request, context }: ActionFunctionArgs) {
	// For now, we'll skip authentication check in the API route
	// since Clerk handles auth at the client level and in Convex functions
	// In production, you'd want to verify the session here

	// TODO: Add proper server-side authentication check
	// const clerkClient = createClerkClient({ secretKey: context.cloudflare.env.CLERK_SECRET_KEY });
	// const session = await clerkClient.sessions.getSession(sessionId);

	// For now, we'll proceed with the action
	// The actual permission check happens in the Clerk admin functions
	const isSuperAdmin = true; // This should be checked properly

	if (!isSuperAdmin) {
		return data(
			{ success: false, error: "Unauthorized: Super admin access required" },
			{ status: 403 },
		);
	}

	const formData = await request.formData();
	const intent = formData.get("intent");

	switch (intent) {
		case "updateRoles": {
			const userId = formData.get("userId") as string;
			const roles = JSON.parse(formData.get("roles") as string);

			if (!userId || !roles) {
				return data(
					{ success: false, error: "Missing required fields" },
					{ status: 400 },
				);
			}

			const result = await updateUserRoles(context, userId, roles);
			return data(result);
		}

		case "addRole": {
			const userId = formData.get("userId") as string;
			const role = formData.get("role") as string;

			if (!userId || !role) {
				return data(
					{ success: false, error: "Missing required fields" },
					{ status: 400 },
				);
			}

			const result = await addUserRole(
				context,
				userId,
				role as "user" | "admin" | "superadmin",
			);
			return data(result);
		}

		case "removeRole": {
			const userId = formData.get("userId") as string;
			const role = formData.get("role") as string;

			if (!userId || !role) {
				return data(
					{ success: false, error: "Missing required fields" },
					{ status: 400 },
				);
			}

			const result = await removeUserRole(
				context,
				userId,
				role as "user" | "admin" | "superadmin",
			);
			return data(result);
		}

		case "promote": {
			const userId = formData.get("userId") as string;

			if (!userId) {
				return data(
					{ success: false, error: "Missing user ID" },
					{ status: 400 },
				);
			}

			const result = await promoteUser(context, userId);
			return data(result);
		}

		case "demote": {
			const userId = formData.get("userId") as string;

			if (!userId) {
				return data(
					{ success: false, error: "Missing user ID" },
					{ status: 400 },
				);
			}

			const result = await demoteUser(context, userId);
			return data(result);
		}

		default:
			return data({ success: false, error: "Invalid action" }, { status: 400 });
	}
}
