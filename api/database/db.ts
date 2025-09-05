/// <reference types="../../worker-configuration.d.ts" />
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// Simple drizzle instance creation (matches middleware pattern)
export function createDb(d1: D1Database) {
	return drizzle(d1);
}

// Enhanced drizzle instance with full schema for type safety
export function createDbWithSchema(d1: D1Database) {
	return drizzle(d1, { schema });
}

// Type for the database instance
export type Database = ReturnType<typeof createDb>;
export type DatabaseWithSchema = ReturnType<typeof createDbWithSchema>;
