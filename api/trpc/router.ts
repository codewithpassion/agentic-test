import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { hasPermission, hasRole, isAdmin } from "../../workers/permissions";
import type { Permission, UserRole } from "../../workers/types";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				code: error.code,
				httpStatus:
					error.code === "UNAUTHORIZED"
						? 401
						: error.code === "FORBIDDEN"
							? 403
							: error.code === "NOT_FOUND"
								? 404
								: 500,
			},
		};
	},
});

// Base router and procedure
export const router = t.router;
export const publicProcedure = t.procedure;

// Authentication middleware
const authMiddleware = t.middleware(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	}
	return next({
		ctx: {
			...ctx,
			user: ctx.user, // Type is now non-null
		},
	});
});

// Role-based middleware factory
const roleMiddleware = (requiredRole: UserRole) =>
	t.middleware(({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Authentication required",
			});
		}

		if (!hasRole(ctx.user, requiredRole)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: `${requiredRole} role required`,
			});
		}

		return next({
			ctx: {
				...ctx,
				user: ctx.user,
			},
		});
	});

// Permission-based middleware factory
const permissionMiddleware = (requiredPermission: Permission) =>
	t.middleware(({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Authentication required",
			});
		}

		if (!hasPermission(ctx.user, requiredPermission)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: `Permission required: ${requiredPermission}`,
			});
		}

		return next({
			ctx: {
				...ctx,
				user: ctx.user,
			},
		});
	});

// Procedure variants
export const protectedProcedure = publicProcedure.use(authMiddleware);
export const adminProcedure = protectedProcedure.use(roleMiddleware("admin"));
export const superAdminProcedure = protectedProcedure.use(
	roleMiddleware("superadmin"),
);

// Permission-specific procedures
export const todoManagerProcedure = protectedProcedure.use(
	permissionMiddleware("manage_todos"),
);

// Ownership middleware factory
export const ownershipMiddleware = (getUserId: (input: unknown) => string) =>
	t.middleware(({ ctx, input, next }) => {
		if (!ctx.user) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Authentication required",
			});
		}

		const resourceUserId = getUserId(input);

		// Allow if user owns the resource or is admin
		if (ctx.user.id !== resourceUserId && !isAdmin(ctx.user)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Access denied: insufficient permissions",
			});
		}

		return next({
			ctx: {
				...ctx,
				user: ctx.user,
			},
		});
	});
