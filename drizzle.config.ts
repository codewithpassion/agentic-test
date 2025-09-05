import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./migrations",
	schema: "./api/database/schema.ts",
	dialect: "sqlite",
	driver: "d1-http",
});
