import { z } from "zod";

export const userRoleSchema = z.enum(["user", "admin", "superadmin"]);

// User management schemas
export const userSearchSchema = z.object({
	search: z.string().optional(),
	role: userRoleSchema.optional(),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
});

export const userUpdateSchema = z.object({
	id: z.string(),
	data: z.object({
		name: z.string().min(1).max(100).optional(),
		email: z.string().email().optional(),
		roles: userRoleSchema.optional(),
		emailVerified: z.boolean().optional(),
	}),
});

export const createUserSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name is too long"),
	email: z.string().email("Invalid email address"),
	roles: userRoleSchema.default("user"),
	emailVerified: z.boolean().default(false),
});
