import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { AuthUser } from "~/types/auth";
import { getAuthUser } from "../../workers/auth-utils";
import { createDb } from "../database/db";

export interface Context {
	db: ReturnType<typeof createDb>;
	user: AuthUser | null;
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
	const user = await getAuthUser(req);

	return {
		db,
		user,
		request: req,
		env,
	};
}

export type TRPCContext = Context;
