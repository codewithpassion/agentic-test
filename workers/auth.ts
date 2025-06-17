import { authSchema } from "@portcityai/better-auth";
import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";
import { customSession, magicLink } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import { MockEmailService, ResendEmailService } from "./services/email";
import type { AppType } from "./types";

export async function authFactory(env: AppType["Bindings"], request: Request) {
	const baseUrl = request.url
		? new URL(request.url).origin
		: "https://example.com";

	if (env?.SESSIONS === undefined) {
		throw new Error("SESSIONS is not defined");
	}

	const emailService =
		env.RESEND_API_KEY && env.DEV_MODE !== "true"
			? new ResendEmailService(env)
			: new MockEmailService();

	const db = env
		? drizzle(env.DB, { schema: authSchema, logger: true })
		: // biome-ignore lint/suspicious/noExplicitAny: <explanation>
			({} as any);

	const auth = betterAuth({
		...withCloudflare(
			{
				autoDetectIpAddress: false,
				geolocationTracking: false,
				d1: env
					? {
							db: db,
							options: {
								usePlural: false,
								debugLogs: true,
							},
						}
					: undefined,
				// @ts-ignore
				kv: env?.SESSIONS as KVNamespace,
			},
			{
				emailAndPassword: { enabled: false },
				secret: env?.BETTER_AUTH_SECRET,
				socialProviders: {},
				user: {
					additionalFields: {
						roles: {
							type: "string[]",
							defaultValue: ["user"],
							validation: {
								enum: ["user", "admin", "superadmin"],
							},
						},
					},
				},

				baseURL: baseUrl,
				plugins: [
					customSession(async ({ user, session }) => {
						if (env.DEV_MODE && user.email === "dominik.fretz@gmail.com") {
							const res = {
								user: {
									...user,
									// @ts-ignore
									roles: [user.roles, "superadmin"],
								},
								session,
							};
							return res;
						}
						return { user, session };
					}),
					magicLink({
						async sendMagicLink(data) {
							const result = await emailService.sendMagicLink({
								email: data.email,
								magicLink: data.url,
								ipAddress:
									request.headers.get("CF-Connecting-IP") ||
									request.headers.get("X-Forwarded-For") ||
									"unknown",
								userAgent: request.headers.get("User-Agent") || undefined,
							});

							if (!result.success) {
								console.error("Failed to send magic link email:", result.error);
								throw new Error(
									"Failed to send verification email. Please try again.",
								);
							}

							console.log("Magic link email sent successfully:", {
								email: data.email,
								messageId: result.messageId,
							});
						},
						expiresIn: 60 * 15, // 5 minutes
						disableSignUp: true, // Disable sign up if user is not found
					}),
				],
			},
		),
	});
	return auth;
}
