import type { UserResource } from "@clerk/types";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { createDb } from "../database/db";

export interface Context {
	db: ReturnType<typeof createDb>;
	user: UserResource | null; // Clerk user from request
	request: Request;
	env: CloudflareBindings;
}

export async function createContext({
	req,
	env,
}: FetchCreateContextFnOptions & {
	env: CloudflareBindings;
}): Promise<Context> {
	const db = createDb(env.DB);

	// TODO: Extract Clerk user from request using Clerk's server-side SDK
	const user = null;

	return {
		db,
		user,
		request: req,
		env,
	};
}

export type TRPCContext = Context;
